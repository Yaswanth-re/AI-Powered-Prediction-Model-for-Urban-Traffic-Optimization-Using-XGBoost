# URBAN-SHIELD AI: Database Architecture

## Relational Schema (PostgreSQL + PostGIS / SQLite)

### Core Entities:
- `users`: User credentials and role-based permissions (`COMMUTER`, `EMERGENCY_RESPONDER`, `CITY_AUTHORITY`, `ADMIN`).
- `road_segments`: Spatial polyline corridors, capacity, speed limit, lanes, intersection flags, live speed & congestion.
- `traffic_records`: Time-series sensor logs.
- `traffic_predictions`: Multi-horizon ML forecasts.
- `accident_records`: Spatial point accident coordinates, severity, weather conditions.
- `hotspots`: DBSCAN polygon cluster boundaries, risk scores, peak risk hours.
- `incidents`: User-reported hazards, upvotes, moderation status.
- `model_registry`: Machine learning model performance tracking.
