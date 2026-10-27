# URBAN-SHIELD AI: System Architecture

## Overview Architecture

```
[ Data Ingestion / Telemetry / Synthesizer ]
                   │
                   ▼
     [ PostgreSQL 16 + PostGIS Database ]
                   │
                   ▼
  [ Feature Engineering & ML Pipeline ]
  (XGBoost / Random Forest / DBSCAN / SHAP)
                   │
                   ▼
       [ FastAPI REST & WebSockets ]
                   │
                   ▼
   [ React 18 + TS + Tailwind Frontend ]
   (Leaflet GIS / Command Center / AI Assistant)
```

## Core Principles
1. **Low Latency & High Throughput**: Async FastAPI handlers serving cached telemetry.
2. **Dual Database Resilience**: Native PostgreSQL/PostGIS with seamless SQLite spatial fallback.
3. **Transparent Explainable AI**: Every prediction exposes contributing risk factors and SHAP feature importance.
