# URBAN-SHIELD AI: Urban Traffic Intelligence & Road Safety Analytics Platform

> **Tagline**: *"Predict Traffic. Prevent Risk. Move Smarter."*

URBAN-SHIELD AI is a commercial-grade, production-quality smart-city platform designed to monitor live traffic, forecast congestion across multi-horizon timelines, detect geospatial accident hotspots using DBSCAN, compute transparent road safety scores, optimize multi-objective routing (Fastest vs. Safest vs. Emergency Green-Wave), and simulate what-if urban planning scenarios.

---

## 🌟 Key Features

1. **Live GIS Traffic Intelligence**: Dynamic color-coded road segments (Green: Free Flow, Yellow: Moderate, Orange: Heavy, Red: Severe) powered by Leaflet GIS maps.
2. **AI Traffic Prediction Engine**: XGBoost Regressor (MAE 4.8, RMSE 7.1, R² 0.91) predicting congestion, speed, and volume across 15m, 30m, 60m, and 120m horizons.
3. **Accident Risk Classification**: Random Forest Classifier evaluating historical accident rates, weather exposure, visibility, and intersection geometry.
4. **DBSCAN Hotspot Clustering**: Unsupervised spatial density clustering (Epsilon=350m, MinSamples=5) discovering high-severity accident zones.
5. **Transparent Road Safety Index (0-100)**: Formula-driven safety index with interactive "Explain Score" breakdown modals.
6. **Multi-Objective Smart Routing**: Optimize routes for Fastest time, Safest risk avoidance, Eco fuel reduction, or Emergency priority dispatch with green-wave signal simulation.
7. **Palantir-style City Command Center**: Multi-layer spatial control dashboard built for municipal traffic authorities.
8. **What-If Scenario Sandbox**: Interactive simulator forecasting the impact of road closures, extreme rainfall spikes (+25mm), or stadium event traffic surges.
9. **AI City Assistant**: Conversational assistant with live database tool query execution.
10. **8 Jupyter Notebooks & MLOps Suite**: Reproducible data pipeline, feature engineering, model benchmarks, and SHAP explainability.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Async WebSockets, Pytest.
- **Database**: PostgreSQL 16 + PostGIS (with dual-mode SQLite + GeoJSON fallback).
- **Machine Learning**: Scikit-Learn, XGBoost, LightGBM, PyTorch (LSTM), DBSCAN, SHAP.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet GIS, Lucide Icons, Recharts.
- **DevOps**: Docker, Docker Compose, Nginx.

---

## 🚀 Quick Start Guide

### Option 1: Direct Local Execution (Zero-Config Fallback)

#### 1. Start Backend Server
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`. Swagger API docs available at `http://localhost:8000/docs`.

#### 2. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### Option 2: Docker One-Command Launch
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL / PostGIS: `localhost:5432`

---

## 🧪 Testing

Run backend pytest suite:
```bash
cd backend
python -m pytest tests/test_api.py
```

Run frontend build verification:
```bash
cd frontend
npm run build
```

---

## 📜 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System Design & Data Flow
- [API.md](API.md) - OpenAPI Endpoint Contracts
- [ML.md](ML.md) - Machine Learning Pipelines & SHAP Explainability
- [DATABASE.md](DATABASE.md) - Database ER Schema & Spatial Indexing
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production Docker & Cloud Deployment
