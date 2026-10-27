# URBAN-SHIELD AI: API Specification

## Endpoints

### 1. Traffic & Roads
- `GET /api/traffic/live`: Fetch live color-coded road segment telemetry and weather.
- `GET /api/traffic/predictions`: Multi-horizon (15m, 30m, 60m, 120m) forecasts.
- `GET /api/roads/{id}`: Detailed corridor metrics.

### 2. Risk & Hotspots
- `GET /api/accidents`: Historical accident logs.
- `GET /api/accidents/hotspots`: DBSCAN spatial accident clusters.

### 3. Routing & Emergency
- `POST /api/routes/plan`: Multi-objective routing (Fastest, Safest, Balanced, Eco, Emergency).

### 4. Incidents & AI Assistant
- `POST /api/incidents`: Crowdsourced incident submission.
- `POST /api/ai/query`: AI City Assistant natural language engine.
- `POST /api/simulation/run`: What-If Scenario Simulator.
