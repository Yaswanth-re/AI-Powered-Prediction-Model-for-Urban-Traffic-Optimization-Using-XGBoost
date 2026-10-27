# URBAN-SHIELD AI: Deployment Guide

## Production Deployment with Docker Compose

### 1. Configure Environment Variables
Create `.env` in root directory:
```env
DATABASE_URL=postgresql://user:password@db:5432/urbanshield
SECRET_KEY=urban-shield-ai-super-secret-production-key-2026
DEMO_MODE=True
CITY_NAME=San Francisco
```

### 2. Launch Services
```bash
docker compose up --build -d
```

### 3. Verify Container Health
```bash
docker compose ps
```
- Backend API: `http://localhost:8000/docs`
- Frontend UI: `http://localhost:3000`
