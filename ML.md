# URBAN-SHIELD AI: Machine Learning Architecture

## Models & Benchmarks

| Task | Algorithm | Version | MAE | RMSE | R² / F1 | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Traffic Forecasting | XGBoost Regressor | v1.4 | 4.8 | 7.1 | R² 0.91 | Champion |
| Traffic Forecasting | PyTorch LSTM | v1.0 | 4.2 | 6.4 | R² 0.94 | Challenger |
| Accident Risk | Random Forest | v2.1 | - | - | F1 0.86 | Champion |
| Hotspot Detection | Spatial DBSCAN | v1.0 | - | - | - | Active |

## Feature Engineering
- Temporal (`hour`, `day_of_week`, `is_weekend`, `is_rush_hour`).
- Lag Features (`traffic_lag_1` .. `traffic_lag_24`).
- Rolling Window (`rolling_mean_1h`, `rolling_std_1h`).
- Environmental (`rainfall_mm`, `visibility_m`).
