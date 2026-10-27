import os
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timedelta, timezone
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import shap

def generate_chronological_traffic_dataset(num_days: int = 60, seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic chronological hourly traffic dataset across 5 corridor types
    with physical traffic dynamics (rush hour waves, day-of-week differences, rain impacts, lag effects).
    """
    np.random.seed(seed)
    start_time = datetime(2026, 8, 1, 0, 0, 0)
    rows = []

    corridor_profiles = [
        {"name": "Anna Salai Arterial Corridor", "road_type": "Arterial", "type_enc": 1, "speed_limit": 50.0, "capacity": 3200, "lanes": 6, "base_cong": 28.0},
        {"name": "OMR Expressway IT Highway", "road_type": "Expressway", "type_enc": 2, "speed_limit": 80.0, "capacity": 4500, "lanes": 6, "base_cong": 22.0},
        {"name": "Poonamallee High Road", "road_type": "Arterial", "type_enc": 1, "speed_limit": 50.0, "capacity": 2800, "lanes": 4, "base_cong": 32.0},
        {"name": "Jawaharlal Nehru Inner Ring Road", "road_type": "Expressway", "type_enc": 2, "speed_limit": 70.0, "capacity": 3800, "lanes": 6, "base_cong": 25.0},
        {"name": "Mylapore Heritage Connector", "road_type": "Local", "type_enc": 0, "speed_limit": 35.0, "capacity": 1400, "lanes": 2, "base_cong": 20.0},
    ]

    total_hours = num_days * 24

    for profile in corridor_profiles:
        prev_cong = profile["base_cong"]
        for h_step in range(total_hours):
            current_dt = start_time + timedelta(hours=h_step)
            hour = current_dt.hour
            dow = current_dt.weekday() # 0 = Monday, 6 = Sunday
            is_weekend = 1 if dow >= 5 else 0

            # Rush hour curve
            if is_weekend:
                # Weekend peak is midday/afternoon (12:00 - 18:00)
                rush_effect = 18.0 * np.exp(-((hour - 15) ** 2) / 14.0)
                is_rush = 1 if 14 <= hour <= 18 else 0
            else:
                # Weekday dual peaks: Morning 08:30-10:30, Evening 17:30-20:30
                morning_peak = 35.0 * np.exp(-((hour - 9) ** 2) / 4.0)
                evening_peak = 42.0 * np.exp(-((hour - 18.5) ** 2) / 5.5)
                rush_effect = morning_peak + evening_peak
                is_rush = 1 if (8 <= hour <= 10 or 17 <= hour <= 20) else 0

            # Weather simulation (occasional rain episodes)
            rain_prob = 0.12 if (h_step % 120 < 24) else 0.02
            rainfall_mm = float(np.random.exponential(scale=6.5)) if np.random.rand() < rain_prob else 0.0
            visibility_m = max(1500.0, 10000.0 - rainfall_mm * 450.0 + np.random.normal(0, 300.0))

            rain_impact = min(22.0, rainfall_mm * 1.8)

            # Cyclical time encoding
            hour_sin = np.sin(2 * np.pi * hour / 24.0)
            hour_cos = np.cos(2 * np.pi * hour / 24.0)

            # Natural noise
            noise = np.random.normal(0, 3.2)

            # Congestion calculation (0 to 100%)
            cong = profile["base_cong"] + rush_effect + rain_impact + (prev_cong - profile["base_cong"]) * 0.25 + noise
            cong = float(np.clip(cong, 5.0, 96.0))

            # Derived speed based on Greenshields traffic stream flow physics
            speed = profile["speed_limit"] * (1.0 - (cong / 100.0) * 0.82)
            speed = float(np.clip(speed, 6.0, profile["speed_limit"]))

            # Volume
            volume = int(profile["capacity"] * (cong / 100.0) * (0.85 + 0.15 * np.random.rand()))

            # Lag features
            lag_1h = prev_cong
            # Estimated 24h lag (with slight noise)
            lag_24h = float(np.clip(profile["base_cong"] + rush_effect * 0.9 + np.random.normal(0, 4.0), 5.0, 95.0))

            rows.append({
                "timestamp": current_dt.isoformat(),
                "corridor_name": profile["name"],
                "road_type": profile["road_type"],
                "road_type_enc": profile["type_enc"],
                "hour_of_day": hour,
                "day_of_week": dow,
                "is_weekend": is_weekend,
                "is_rush_hour": is_rush,
                "hour_sin": round(hour_sin, 4),
                "hour_cos": round(hour_cos, 4),
                "speed_limit_kmh": profile["speed_limit"],
                "capacity_vph": profile["capacity"],
                "lanes": profile["lanes"],
                "rainfall_mm": round(rainfall_mm, 2),
                "visibility_m": round(visibility_m, 1),
                "lag_congestion_1h": round(lag_1h, 1),
                "lag_congestion_24h": round(lag_24h, 1),
                "congestion_pct": round(cong, 1), # TARGET
                "speed_kmh": round(speed, 1),
                "volume_vph": volume
            })
            prev_cong = cong

    df = pd.DataFrame(rows)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by="timestamp").reset_index(drop=True)
    return df

def train_and_evaluate():
    print("[1/5] Generating chronological benchmark traffic dataset...")
    df = generate_chronological_traffic_dataset(num_days=45, seed=2026)
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    csv_path = os.path.join(data_dir, "traffic_timeseries.csv")
    df.to_csv(csv_path, index=False)
    print(f"      Saved {len(df)} chronological records to {csv_path}")

    # Feature columns - strictly preventing target leakage
    feature_cols = [
        "road_type_enc", "hour_of_day", "day_of_week", "is_weekend", "is_rush_hour",
        "hour_sin", "hour_cos", "speed_limit_kmh", "capacity_vph", "lanes",
        "rainfall_mm", "visibility_m", "lag_congestion_1h", "lag_congestion_24h"
    ]
    target_col = "congestion_pct"

    X = df[feature_cols]
    y = df[target_col]

    # Chronological Split (80% train, 20% held-out test)
    split_idx = int(len(df) * 0.80)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    timestamps_test = df["timestamp"].iloc[split_idx:]

    print(f"[2/5] Chronological split complete: {len(X_train)} train rows, {len(X_test)} held-out test rows.")

    # 1. Baseline 1: Historical Average Baseline (mean of training data by hour of day and is_weekend)
    train_df = df.iloc[:split_idx].copy()
    hist_lookup = train_df.groupby(["hour_of_day", "is_weekend"])[target_col].mean().to_dict()
    test_hist_preds = [hist_lookup.get((h, w), y_train.mean()) for h, w in zip(X_test["hour_of_day"], X_test["is_weekend"])]
    mae_hist = float(mean_absolute_error(y_test, test_hist_preds))
    rmse_hist = float(np.sqrt(mean_squared_error(y_test, test_hist_preds)))
    r2_hist = float(r2_score(y_test, test_hist_preds))
    print(f"      Baseline (Historical Avg): MAE={mae_hist:.2f}, RMSE={rmse_hist:.2f}, R2={r2_hist:.3f}")

    # 2. Baseline 2: Persistence Baseline (predicts lag_congestion_1h)
    mae_pers = float(mean_absolute_error(y_test, X_test["lag_congestion_1h"]))
    rmse_pers = float(np.sqrt(mean_squared_error(y_test, X_test["lag_congestion_1h"])))
    r2_pers = float(r2_score(y_test, X_test["lag_congestion_1h"]))
    print(f"      Baseline (Persistence 1h):  MAE={mae_pers:.2f}, RMSE={rmse_pers:.2f}, R2={r2_pers:.3f}")

    # 3. Random Forest Regressor Benchmark
    print("[3/5] Training Random Forest Regressor benchmark...")
    rf_model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_test)
    mae_rf = float(mean_absolute_error(y_test, rf_preds))
    rmse_rf = float(np.sqrt(mean_squared_error(y_test, rf_preds)))
    r2_rf = float(r2_score(y_test, rf_preds))
    print(f"      Random Forest:              MAE={mae_rf:.2f}, RMSE={rmse_rf:.2f}, R2={r2_rf:.3f}")

    # 4. XGBoost Regressor (Champion Model)
    print("[4/5] Training XGBoost Regressor (Champion Model)...")
    xgb_model = xgb.XGBRegressor(
        n_estimators=160,
        learning_rate=0.07,
        max_depth=5,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        objective="reg:squarederror"
    )
    xgb_model.fit(X_train, y_train)
    xgb_preds = xgb_model.predict(X_test)
    mae_xgb = float(mean_absolute_error(y_test, xgb_preds))
    rmse_xgb = float(np.sqrt(mean_squared_error(y_test, xgb_preds)))
    r2_xgb = float(r2_score(y_test, xgb_preds))
    print(f"      XGBoost Regressor:          MAE={mae_xgb:.2f}, RMSE={rmse_xgb:.2f}, R2={r2_xgb:.3f}")

    # 5. SHAP Explainability Engine
    print("[5/5] Computing SHAP TreeExplainer values...")
    explainer = shap.TreeExplainer(xgb_model)
    # Subsample 150 test samples for fast, deterministic SHAP summary
    sample_X = X_test.sample(min(150, len(X_test)), random_state=42)
    shap_values = explainer.shap_values(sample_X)

    # Compute mean absolute SHAP importance per feature
    global_importance = np.abs(shap_values).mean(axis=0)
    feature_importance_list = [
        {"feature": feat, "importance": round(float(imp), 4), "rank": int(rank + 1)}
        for rank, (imp, feat) in enumerate(sorted(zip(global_importance, feature_cols), reverse=True))
    ]

    # Model and metadata saving
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "xgboost_traffic_model.joblib")
    joblib.dump(xgb_model, model_path)
    print(f"      Saved XGBoost model artifact to {model_path}")

    metadata = {
        "model_name": "XGBoost Regressor",
        "version": "v2.0-production",
        "target_variable": "congestion_pct (Traffic Congestion Percentage 0-100%)",
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "total_dataset_rows": len(df),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "split_strategy": "Chronological (First 80% train, held-out 20% test)",
        "feature_columns": feature_cols,
        "evaluation_metrics": {
            "xgboost": {"mae": round(mae_xgb, 2), "rmse": round(rmse_xgb, 2), "r2_score": round(r2_xgb, 3)},
            "random_forest": {"mae": round(mae_rf, 2), "rmse": round(rmse_rf, 2), "r2_score": round(r2_rf, 3)},
            "historical_average": {"mae": round(mae_hist, 2), "rmse": round(rmse_hist, 2), "r2_score": round(r2_hist, 3)},
            "persistence_baseline": {"mae": round(mae_pers, 2), "rmse": round(rmse_pers, 2), "r2_score": round(r2_pers, 3)}
        },
        "shap_global_importance": feature_importance_list,
        "causal_disclaimer": "Feature importance values reflect mathematical statistical association and model weight in the decision tree splits; they do not establish causal relationships."
    }

    metadata_path = os.path.join(models_dir, "xgboost_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"      Saved training metadata to {metadata_path}")
    print("[SUCCESS] XGBoost training and SHAP explainability pipeline finished successfully!")

if __name__ == "__main__":
    train_and_evaluate()
