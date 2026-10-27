import pandas as pd
import numpy as np
from datetime import datetime, timezone

def create_traffic_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Creates feature set for traffic forecasting models:
    - Temporal features (hour, day_of_week, weekend, rush_hour)
    - Lag features (lag_1, lag_2, lag_3, lag_6, lag_12, lag_24)
    - Rolling window statistics (15m, 30m, 1h rolling mean and std)
    - Weather & spatial attributes
    """
    data = df.copy()
    if 'timestamp' in data.columns:
        data['timestamp'] = pd.to_datetime(data['timestamp'])
        data['hour'] = data['timestamp'].dt.hour
        data['day_of_week'] = data['timestamp'].dt.dayofweek
        data['is_weekend'] = data['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        data['is_rush_hour'] = data['hour'].apply(lambda h: 1 if (7 <= h <= 9 or 16 <= h <= 19) else 0)
    else:
        data['hour'] = 12
        data['day_of_week'] = 2
        data['is_weekend'] = 0
        data['is_rush_hour'] = 0

    # Ensure numerical features
    if 'congestion_pct' not in data.columns:
        data['congestion_pct'] = 25.0
    if 'speed_kmh' not in data.columns:
        data['speed_kmh'] = 45.0
    if 'rainfall_mm' not in data.columns:
        data['rainfall_mm'] = 0.0

    # Lag features per segment
    data = data.sort_values(by=['segment_id', 'timestamp']) if 'segment_id' in data.columns and 'timestamp' in data.columns else data
    
    for lag in [1, 2, 3, 6, 12, 24]:
        data[f'traffic_lag_{lag}'] = data.groupby('segment_id')['congestion_pct'].shift(lag) if 'segment_id' in data.columns else data['congestion_pct'].shift(lag)
        data[f'traffic_lag_{lag}'] = data[f'traffic_lag_{lag}'].fillna(data['congestion_pct'])

    # Rolling window features
    if 'segment_id' in data.columns:
        data['rolling_mean_1h'] = data.groupby('segment_id')['congestion_pct'].transform(lambda x: x.rolling(4, min_periods=1).mean())
        data['rolling_std_1h'] = data.groupby('segment_id')['congestion_pct'].transform(lambda x: x.rolling(4, min_periods=1).std()).fillna(0.0)
    else:
        data['rolling_mean_1h'] = data['congestion_pct']
        data['rolling_std_1h'] = 0.0

    return data

def extract_segment_ml_features(segment_dict: dict, weather_dict: dict = None) -> dict:
    """Extract single-instance feature vector for real-time inference"""
    now = datetime.now(timezone.utc)
    hour = now.hour
    day = now.weekday()
    is_weekend = 1 if day >= 5 else 0
    is_rush = 1 if (7 <= hour <= 9 or 16 <= hour <= 19) else 0

    rain = weather_dict.get('rainfall_mm', 0.0) if weather_dict else 0.0
    vis = weather_dict.get('visibility_m', 10000.0) if weather_dict else 10000.0

    return {
        'hour': hour,
        'day_of_week': day,
        'is_weekend': is_weekend,
        'is_rush_hour': is_rush,
        'rainfall_mm': rain,
        'visibility_m': vis,
        'current_speed_kmh': segment_dict.get('current_speed_kmh', 45.0),
        'current_congestion_pct': segment_dict.get('current_congestion_pct', 25.0),
        'capacity_vph': segment_dict.get('capacity_vph', 2000),
        'speed_limit_kmh': segment_dict.get('speed_limit_kmh', 60.0),
        'accident_frequency_historical': segment_dict.get('accident_frequency_historical', 2.0),
        'is_intersection': 1 if segment_dict.get('is_intersection', False) else 0,
        'traffic_lag_1': segment_dict.get('current_congestion_pct', 25.0),
        'traffic_lag_2': max(5.0, segment_dict.get('current_congestion_pct', 25.0) * 0.95),
        'traffic_lag_3': max(5.0, segment_dict.get('current_congestion_pct', 25.0) * 0.90),
        'rolling_mean_1h': segment_dict.get('current_congestion_pct', 25.0),
        'rolling_std_1h': 3.5
    }
