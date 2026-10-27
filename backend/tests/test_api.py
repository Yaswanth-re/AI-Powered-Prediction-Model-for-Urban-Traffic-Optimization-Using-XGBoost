import pytest
import sys, os
# Ensure the backend package root is in PYTHONPATH for module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import User, UserRole
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.main import app

client = TestClient(app)


def create_user(email: str = "authority@test.local", password: str = "StrongPass!123", role: UserRole = UserRole.CITY_AUTHORITY) -> User:
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(email=email, name="Test Authority", hashed_password=get_password_hash(password), role=role)
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.hashed_password = get_password_hash(password)
            user.role = role
            db.commit()
        return user
    finally:
        db.close()


def login_as(email: str = "authority@test.local", password: str = "StrongPass!123") -> str:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "URBAN-SHIELD AI"
    assert "version" in data

def test_login_and_protected_route_enforcement():
    email = "authority@test.local"
    password = "StrongPass!123"
    create_user(email=email, password=password)

    bad = client.post("/api/auth/login", json={"email": email, "password": "wrong-password"})
    assert bad.status_code == 401

    success = client.post("/api/auth/login", json={"email": email, "password": password})
    assert success.status_code == 200
    token = success.json()["access_token"]
    assert token

    unauthorized = client.get("/api/traffic/live")
    assert unauthorized.status_code == 401

    authorized = client.get("/api/traffic/live", headers={"Authorization": f"Bearer {token}"})
    assert authorized.status_code == 200
    data = authorized.json()
    assert "segments" in data
    assert len(data["segments"]) > 0


def test_get_live_traffic():
    token = login_as()
    response = client.get("/api/traffic/live", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "segments" in data
    assert len(data["segments"]) > 0

def test_get_predictions():
    token = login_as()
    response = client.get("/api/traffic/predictions", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["model_champion"] == "XGBoost Regressor v1.4"
    assert len(data["data"]) > 0


def test_get_hotspots():
    token = login_as()
    response = client.get("/api/accidents/hotspots", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "hotspots" in data
    assert len(data["hotspots"]) > 0


def test_plan_route():
    token = login_as()
    payload = {
        "origin": {"lat": 37.7885, "lon": -122.4005},
        "destination": {"lat": 37.7735, "lon": -122.4215},
        "mode": "Balanced"
    }
    response = client.post("/api/routes/plan", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "active_route" in data
    assert data["active_route"]["mode"] == "Balanced"


def test_ai_assistant():
    token = login_as()
    payload = {"prompt": "Which roads are dangerous right now?"}
    response = client.post("/api/ai/query", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "response" in data


def test_simulation():
    token = login_as()
    payload = {
        "traffic_volume_change_pct": 30,
        "rainfall_mm": 10.0,
        "road_closure_id": 1
    }
    response = client.post("/api/simulation/run", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "simulated" in data
    assert data["simulated"]["avg_congestion_pct"] > 38.0


def test_places_autocomplete():
    token = login_as()
    response = client.get("/api/places/autocomplete?query=Market&city=San Francisco", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert len(data["suggestions"]) > 0
    s0 = data["suggestions"][0]
    assert "place_id" in s0
    assert "name" in s0


def test_places_details_corridor():
    token = login_as()
    response = client.get("/api/places/details?place_id=corridor_Market Street Central Arterial", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "lat" in data
    assert "lon" in data
    assert data["lat"] > 37.0


def test_plan_route_invalid_coordinates():
    token = login_as()
    payload = {
        "origin": {"lat": "invalid", "lon": -122.4005},
        "destination": {"lat": 37.7735, "lon": -122.4215},
        "mode": "Balanced"
    }
    response = client.post("/api/routes/plan", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 422


def test_plan_route_identical_coordinates():
    token = login_as()
    payload = {
        "origin": {"lat": 37.7885, "lon": -122.4005},
        "destination": {"lat": 37.7885, "lon": -122.4005},
        "mode": "Balanced"
    }
    response = client.post("/api/routes/plan", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 422
    assert "distinct" in response.json()["detail"].lower()


def test_create_and_fetch_hotspot():
    token = login_as()
    payload = {
        "name": "Automated Test Corridor Hotspot",
        "center_lat": 37.7799,
        "center_lon": -122.4180,
        "radius_meters": 350.0,
        "risk_score": 88.0,
        "primary_road_name": "Van Ness Test Way",
        "peak_risk_hours": "18:00 - 21:00"
    }
    # Create hotspot
    res = client.post("/api/hotspots", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    created = res.json()
    assert created["name"] == payload["name"]
    assert created["center_lat"] == payload["center_lat"]
    assert created["center_lon"] == payload["center_lon"]
    assert created["hotspot_type"] == "USER_ADDED"
    assert len(created["boundary_polygon"]) == 4

    # Fetch hotspots and confirm it appears in the list
    get_res = client.get("/api/accidents/hotspots?city=San%20Francisco", headers={"Authorization": f"Bearer {token}"})
    assert get_res.status_code == 200
    all_hotspots = get_res.json()["hotspots"]
    user_added = [h for h in all_hotspots if h.get("name") == payload["name"]]
    assert len(user_added) >= 1
    assert user_added[0]["hotspot_type"] == "USER_ADDED"

