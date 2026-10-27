import math
import os
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.models import (
    User, UserRole, RoadSegment, TrafficRecord, TrafficPrediction,
    AccidentRecord, Hotspot, WeatherRecord, IncidentReport,
    IncidentSeverity, IncidentConfidence, ModelRegistry, Alert
)
from app.db.session import engine, SessionLocal, Base

# 8 Clean, Distinct Major Arterial Corridors per City with crisp non-overlapping polyline paths
CITY_CORRIDORS = {
    "San Francisco": [
        {"name": "Market Street Central Arterial", "type": "Arterial", "start": [37.7885, -122.4005], "end": [37.7735, -122.4215], "speed": 50.0, "lanes": 4, "location": "Downtown Financial District"},
        {"name": "US-101 Bayshore Highway", "type": "Expressway", "start": [37.7610, -122.4040], "end": [37.7720, -122.4055], "speed": 100.0, "lanes": 6, "location": "SoMa Expressway Link"},
        {"name": "Van Ness Avenue Transit Corridor", "type": "Arterial", "start": [37.7750, -122.4190], "end": [37.7950, -122.4230], "speed": 50.0, "lanes": 4, "location": "Civic Center / Mid-Market"},
        {"name": "Embarcadero Coastal Promenade", "type": "Arterial", "start": [37.7950, -122.3930], "end": [37.8080, -122.4080], "speed": 50.0, "lanes": 4, "location": "Waterfront Ferry Building"},
        {"name": "Mission Street Commercial Way", "type": "Arterial", "start": [37.7600, -122.4190], "end": [37.7850, -122.4050], "speed": 40.0, "lanes": 4, "location": "Mission District"},
        {"name": "Geary Boulevard East-West", "type": "Arterial", "start": [37.7810, -122.4300], "end": [37.7800, -122.4700], "speed": 60.0, "lanes": 6, "location": "Japantown to Richmond"},
        {"name": "Lombard Street Curve", "type": "Local", "start": [37.8020, -122.4260], "end": [37.8010, -122.4240], "speed": 30.0, "lanes": 2, "location": "Russian Hill"},
        {"name": "Fell & Oak Park Connector", "type": "Arterial", "start": [37.7730, -122.4280], "end": [37.7720, -122.4500], "speed": 50.0, "lanes": 4, "location": "Panhandle / Golden Gate Gate"}
    ],
    "Bengaluru": [
        {"name": "Outer Ring Road (ORR Tech Belt)", "type": "Expressway", "start": [12.9352, 77.6947], "end": [12.9800, 77.6800], "speed": 80.0, "lanes": 6, "location": "Bellandur to Marathahalli"},
        {"name": "MG Road Central Boulevard", "type": "Arterial", "start": [12.9756, 77.6066], "end": [12.9720, 77.6200], "speed": 50.0, "lanes": 4, "location": "CBD Central Business District"},
        {"name": "Hosur Road Highway Corridor", "type": "Expressway", "start": [12.9172, 77.6228], "end": [12.8500, 77.6600], "speed": 90.0, "lanes": 6, "location": "Silk Board to Electronic City"},
        {"name": "Indiranagar 100ft Road", "type": "Arterial", "start": [12.9783, 77.6390], "end": [12.9600, 77.6390], "speed": 40.0, "lanes": 4, "location": "Indiranagar Retail District"},
        {"name": "Old Airport Road Transit Arterial", "type": "Arterial", "start": [12.9600, 77.6400], "end": [12.9550, 77.6800], "speed": 50.0, "lanes": 4, "location": "Domlur to HAL"},
        {"name": "Hebbal Flyover Expressway", "type": "Expressway", "start": [13.0358, 77.5970], "end": [13.0600, 77.5970], "speed": 80.0, "lanes": 6, "location": "Hebbal Airport Gateway"},
        {"name": "Koramangala 80ft Main Road", "type": "Arterial", "start": [12.9350, 77.6150], "end": [12.9350, 77.6350], "speed": 40.0, "lanes": 4, "location": "Koramangala Startup Hub"},
        {"name": "Richmond Road Connecting Line", "type": "Arterial", "start": [12.9650, 77.5950], "end": [12.9650, 77.6150], "speed": 50.0, "lanes": 4, "location": "Richmond Town"}
    ],
    "New York City": [
        {"name": "Broadway Manhattan Avenue", "type": "Arterial", "start": [40.7580, -73.9855], "end": [40.7128, -74.0060], "speed": 40.0, "lanes": 4, "location": "Times Square to City Hall"},
        {"name": "FDR Drive Waterfront Highway", "type": "Expressway", "start": [40.7100, -73.9780], "end": [40.7500, -73.9700], "speed": 80.0, "lanes": 6, "location": "East River Waterfront"},
        {"name": "5th Avenue Midtown Corridor", "type": "Arterial", "start": [40.7650, -73.9750], "end": [40.7300, -73.9960], "speed": 40.0, "lanes": 4, "location": "Midtown & Washington Square"},
        {"name": "42nd Street Crosstown Boulevard", "type": "Arterial", "start": [40.7580, -74.0000], "end": [40.7500, -73.9700], "speed": 35.0, "lanes": 4, "location": "Grand Central to Port Authority"},
        {"name": "Holland Tunnel Approach Expressway", "type": "Expressway", "start": [40.7250, -74.0100], "end": [40.7250, -74.0300], "speed": 70.0, "lanes": 4, "location": "SoHo / Hudson River Crossing"},
        {"name": "Queensboro Bridge Feed", "type": "Expressway", "start": [40.7600, -73.9600], "end": [40.7500, -73.9400], "speed": 70.0, "lanes": 4, "location": "Upper East Side to Queens"},
        {"name": "Houston Street Arterial", "type": "Arterial", "start": [40.7230, -74.0050], "end": [40.7200, -73.9750], "speed": 45.0, "lanes": 4, "location": "Lower East Side"},
        {"name": "Canal Street Downtown Link", "type": "Arterial", "start": [40.7190, -74.0100], "end": [40.7150, -73.9900], "speed": 35.0, "lanes": 4, "location": "Chinatown & Tribeca"}
    ],
    "London": [
        {"name": "Piccadilly Circus Central Way", "type": "Arterial", "start": [51.5100, -0.1340], "end": [51.5050, -0.1450], "speed": 30.0, "lanes": 4, "location": "West End Theatre District"},
        {"name": "A40 Westway Elevated Highway", "type": "Expressway", "start": [51.5200, -0.2100], "end": [51.5220, -0.1600], "speed": 70.0, "lanes": 6, "location": "Paddington to White City"},
        {"name": "Tower Bridge Approach Route", "type": "Arterial", "start": [51.5080, -0.0760], "end": [51.5000, -0.0760], "speed": 30.0, "lanes": 2, "location": "City of London to Southwark"},
        {"name": "Oxford Street Shopping Corridor", "type": "Arterial", "start": [51.5150, -0.1550], "end": [51.5160, -0.1300], "speed": 25.0, "lanes": 2, "location": "Marble Arch to Tottenham Ct Rd"},
        {"name": "Euston Road Ring Arterial", "type": "Arterial", "start": [51.5280, -0.1400], "end": [51.5300, -0.1200], "speed": 40.0, "lanes": 4, "location": "King's Cross & St Pancras"},
        {"name": "Blackfriars Bypass Expressway", "type": "Arterial", "start": [51.5120, -0.1040], "end": [51.5080, -0.1040], "speed": 40.0, "lanes": 4, "location": "Thames River Crossing"},
        {"name": "Vauxhall Junction Corridor", "type": "Arterial", "start": [51.4860, -0.1240], "end": [51.4800, -0.1200], "speed": 40.0, "lanes": 4, "location": "Vauxhall Transit Hub"},
        {"name": "Victoria Embankment Drive", "type": "Arterial", "start": [51.5080, -0.1220], "end": [51.5110, -0.1100], "speed": 40.0, "lanes": 4, "location": "Westminster Waterfront"}
    ],
    "Tokyo": [
        {"name": "Shibuya Crossing Main Arterial", "type": "Arterial", "start": [35.6595, 139.7005], "end": [35.6650, 139.7050], "speed": 40.0, "lanes": 4, "location": "Shibuya Station District"},
        {"name": "Metropolitan Expressway #3 (Shibuya Route)", "type": "Expressway", "start": [35.6550, 139.6900], "end": [35.6650, 139.7200], "speed": 80.0, "lanes": 4, "location": "Shibuya-Roppongi Elevated"},
        {"name": "Meiji Dori Central Avenue", "type": "Arterial", "start": [35.6500, 139.7050], "end": [35.6900, 139.7050], "speed": 50.0, "lanes": 4, "location": "Ebisu to Shinjuku"},
        {"name": "Yasukuni Dori East-West Corridor", "type": "Arterial", "start": [35.6920, 139.7000], "end": [35.6950, 139.7400], "speed": 50.0, "lanes": 6, "location": "Shinjuku to Chiyoda"},
        {"name": "Roppongi Dori Expressway Link", "type": "Arterial", "start": [35.6630, 139.7300], "end": [35.6670, 139.7450], "speed": 50.0, "lanes": 4, "location": "Roppongi Hills & Akasaka"},
        {"name": "Ginza Chuo Dori Luxury Way", "type": "Arterial", "start": [35.6700, 139.7650], "end": [35.6780, 139.7720], "speed": 35.0, "lanes": 4, "location": "Ginza Shopping District"},
        {"name": "Harajuku Takeshita Approach", "type": "Local", "start": [35.6700, 139.7020], "end": [35.6730, 139.7060], "speed": 30.0, "lanes": 2, "location": "Harajuku & Omotesando"},
        {"name": "Shinjuku Dori Main Boulevard", "type": "Arterial", "start": [35.6900, 139.7000], "end": [35.6880, 139.7200], "speed": 40.0, "lanes": 4, "location": "Shinjuku South Gate"}
    ]
}

def seed_database():
    if not settings.ALLOW_DB_RESET and not os.getenv("ALLOW_DB_RESET", "").lower() in {"1", "true", "yes"}:
        raise PermissionError("Database seeding is disabled in this environment. Set ALLOW_DB_RESET=true to allow a reset.")

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        print("[SEED] Seeding URBAN-SHIELD AI Database across 5 Global Smart Cities with Clean Corridors...")

        # 1. Seed Users
        users = [
            User(email="commuter@urbanshield.ai", name="Alex Commuter", hashed_password=get_password_hash("commuter123"), role=UserRole.COMMUTER),
            User(email="responder@urbanshield.ai", name="Captain Sarah (EMS)", hashed_password=get_password_hash("responder123"), role=UserRole.EMERGENCY_RESPONDER),
            User(email="authority@urbanshield.ai", name="Director Marcus (DOT)", hashed_password=get_password_hash("authority123"), role=UserRole.CITY_AUTHORITY),
            User(email="admin@urbanshield.ai", name="System Admin", hashed_password=get_password_hash("admin123"), role=UserRole.ADMIN),
        ]
        db.add_all(users)
        db.commit()
        print("[OK] Users seeded (4 distinct roles created).")

        # 2. Seed 8 Clean, Crisp Corridors per City (40 Total Segments)
        all_segments = []
        seg_id_counter = 1

        for city_name, corridors in CITY_CORRIDORS.items():
            for c in corridors:
                s_lat, s_lon = c["start"]
                e_lat, e_lon = c["end"]
                mid_lat = (s_lat + e_lat) / 2
                mid_lon = (s_lon + e_lon) / 2

                coords = [[s_lat, s_lon], [mid_lat, mid_lon], [e_lat, e_lon]]
                dist = math.sqrt((e_lat - s_lat)**2 + (e_lon - s_lon)**2) * 111.0

                speed_limit = c["speed"]
                cur_speed = round(max(10.0, speed_limit * random.uniform(0.35, 0.92)), 1)
                congestion = round(max(8.0, (1 - (cur_speed / speed_limit)) * 100), 1)
                safety = round(max(20.0, 100 - congestion * 0.55 - (12.0 if random.random() > 0.75 else 0)), 1)

                risk_level = "LOW"
                if safety < 45: risk_level = "CRITICAL"
                elif safety < 60: risk_level = "HIGH"
                elif safety < 75: risk_level = "MEDIUM"

                seg = RoadSegment(
                    id=seg_id_counter,
                    name=f"{city_name} - {c['name']}",
                    road_type=c["type"],
                    start_lat=s_lat, start_lon=s_lon,
                    end_lat=e_lat, end_lon=e_lon,
                    path_coordinates=coords,
                    length_km=round(max(0.8, dist), 2),
                    capacity_vph=2400 if c["type"] == "Expressway" else 1600,
                    speed_limit_kmh=speed_limit,
                    lanes=c["lanes"],
                    accident_frequency_historical=round(random.uniform(1.2, 7.8), 1),
                    is_intersection=random.random() > 0.5,
                    has_signals=True,
                    current_speed_kmh=cur_speed,
                    current_volume_vph=int(1600 * (congestion / 100.0)),
                    current_congestion_pct=congestion,
                    current_safety_score=safety,
                    current_risk_level=risk_level,
                    weather_impact_factor=1.0,
                    last_updated=datetime.now(timezone.utc)
                )
                all_segments.append(seg)
                seg_id_counter += 1

        db.add_all(all_segments)
        db.commit()
        print(f"[OK] {len(all_segments)} Clean Arterial Corridors created across 5 cities.")

        # 3. Seed Historical Traffic Records
        now = datetime.now(timezone.utc)
        records = []
        for seg in all_segments:
            for h in range(24):
                dt = now - timedelta(hours=24-h)
                hour = dt.hour
                is_rush = (7 <= hour <= 9) or (16 <= hour <= 19)
                is_wkend = dt.weekday() >= 5
                
                base_speed = seg.speed_limit_kmh
                speed = max(12.0, base_speed * random.uniform(0.3, 0.6)) if (is_rush and not is_wkend) else max(20.0, base_speed * random.uniform(0.7, 0.98))
                cong = round((1 - (speed / base_speed)) * 100, 1)
                vol = int(seg.capacity_vph * (cong / 100.0) * random.uniform(0.8, 1.2))

                records.append(TrafficRecord(
                    segment_id=seg.id, timestamp=dt, speed_kmh=round(speed, 1),
                    volume_vph=vol, density_vpk=round(vol / max(speed, 5.0), 1),
                    congestion_pct=max(5.0, cong), rainfall_mm=0.0, visibility_m=10000.0,
                    is_weekend=is_wkend, is_rush_hour=is_rush
                ))

        db.add_all(records)
        db.commit()
        print(f"[OK] {len(records)} Historical Traffic Records created.")

        # 4. Seed Predictions
        preds = []
        for seg in all_segments:
            for horizon in [15, 30, 60, 120]:
                factor = 1.0 + (random.uniform(-0.15, 0.25) * (horizon / 60.0))
                pred_cong = min(98.0, max(5.0, seg.current_congestion_pct * factor))
                pred_speed = max(10.0, seg.speed_limit_kmh * (1 - (pred_cong / 100.0)))
                
                preds.append(TrafficPrediction(
                    segment_id=seg.id, horizon_minutes=horizon,
                    predicted_speed_kmh=round(pred_speed, 1),
                    predicted_congestion_pct=round(pred_cong, 1),
                    predicted_volume_vph=int(seg.capacity_vph * (pred_cong / 100.0)),
                    confidence_lower_pct=round(max(0, pred_cong - 6.5), 1),
                    confidence_upper_pct=round(min(100, pred_cong + 7.2), 1),
                    model_name="XGBoost v1.4 (Active)"
                ))

        db.add_all(preds)
        db.commit()
        print(f"[OK] {len(preds)} Traffic Predictions generated.")

        # 5. Seed Historical Accidents per Corridor
        accidents = []
        for seg in all_segments:
            for _ in range(random.randint(3, 6)):
                lat = seg.start_lat + (random.random() - 0.5) * 0.002
                lon = seg.start_lon + (random.random() - 0.5) * 0.002
                sev = random.choices([IncidentSeverity.LOW, IncidentSeverity.MEDIUM, IncidentSeverity.HIGH, IncidentSeverity.CRITICAL], weights=[0.50, 0.35, 0.12, 0.03])[0]

                accidents.append(AccidentRecord(
                    segment_id=seg.id, lat=lat, lon=lon,
                    timestamp=now - timedelta(days=random.randint(0, 60), hours=random.randint(0, 23)),
                    severity=sev, vehicles_involved=random.randint(1, 3),
                    weather_condition=random.choice(["Clear", "Clear", "Rain"]),
                    lighting_condition=random.choice(["Daylight", "Night - Streetlights"]),
                    contributing_factors=random.sample(["Speeding", "Heavy Congestion", "Rain/Wet Road"], k=2)
                ))

        db.add_all(accidents)
        db.commit()
        print(f"[OK] {len(accidents)} Accident Records seeded across clean corridors.")

        # 6. Seed DBSCAN Hotspots per City
        hotspots = []
        for city_name, corridors in CITY_CORRIDORS.items():
            c0 = corridors[0]
            h_lat, h_lon = c0["start"][0], c0["start"][1]
            poly = [[h_lat + 0.0015, h_lon - 0.0015], [h_lat + 0.0015, h_lon + 0.0015], [h_lat - 0.0015, h_lon + 0.0015], [h_lat - 0.0015, h_lon - 0.0015]]

            hotspots.append(Hotspot(
                name=f"{city_name} Hotspot ({c0['name']})",
                center_lat=h_lat, center_lon=h_lon, radius_meters=300.0,
                boundary_polygon=poly, accident_count_30d=random.randint(22, 45),
                high_severity_count=random.randint(5, 15), risk_score=round(random.uniform(82.0, 95.0), 1),
                peak_risk_hours="17:00 - 20:00", primary_road_name=c0["name"], is_active=True
            ))

        db.add_all(hotspots)
        db.commit()
        print(f"[OK] {len(hotspots)} Clean Hotspots created.")

        # 7. Weather & Model Registry & Alerts
        weather = WeatherRecord(timestamp=now, temperature_c=18.5, rainfall_mm=2.4, humidity_pct=72.0, visibility_m=8500.0, wind_speed_kmh=16.5, condition="Light Rain", severe_weather_alert=False)
        db.add(weather)

        incidents = [
            IncidentReport(category="Accident", description="Two vehicle collision blocking left lane.", lat=37.7830, lon=-122.4070, road_name="San Francisco - Market Street Central Arterial", severity=IncidentSeverity.HIGH, confidence=IncidentConfidence.VERIFIED, upvotes=14),
            IncidentReport(category="Pothole", description="Deep pothole causing vehicle swerving.", lat=12.9756, lon=77.6066, road_name="Bengaluru - MG Road Central Boulevard", severity=IncidentSeverity.MEDIUM, confidence=IncidentConfidence.HIGH, upvotes=19),
            IncidentReport(category="Traffic Jam", description="Heavy congestion near tunnel entrance.", lat=40.7580, lon=-73.9855, road_name="NYC - Broadway Manhattan Avenue", severity=IncidentSeverity.MEDIUM, confidence=IncidentConfidence.HIGH, upvotes=28),
        ]
        db.add_all(incidents)

        models = [
            ModelRegistry(name="Traffic Forecasting XGBoost", algorithm="XGBoost", version="v1.4", task="Traffic Prediction", mae=4.8, rmse=7.1, r2_score=0.91, f1_score=None, is_active=True, features_used=["hour", "day_of_week", "rush_hour", "lag_1", "lag_2", "rolling_mean_1h", "rainfall"]),
            ModelRegistry(name="Traffic Forecasting LSTM", algorithm="PyTorch LSTM", version="v1.0", task="Traffic Prediction", mae=4.2, rmse=6.4, r2_score=0.94, f1_score=None, is_active=False, features_used=["traffic_sequence_24h", "weather_sequence"]),
            ModelRegistry(name="Accident Risk Random Forest", algorithm="Random Forest Classifier", version="v2.1", task="Accident Risk Classification", mae=None, rmse=None, r2_score=None, f1_score=0.86, is_active=True, features_used=["historical_accidents", "congestion", "weather", "lighting", "intersection_flag"]),
            ModelRegistry(name="DBSCAN Hotspot Finder", algorithm="DBSCAN Clustering", version="v1.0", task="Hotspot Clustering", mae=None, rmse=None, r2_score=None, f1_score=None, is_active=True, features_used=["lat", "lon", "severity", "timestamp"]),
        ]
        db.add_all(models)

        alerts = [
            Alert(title="Severe Congestion Forecasted", message="Predicted congestion spike (+28%) on US-101 Bayshore Highway in 30 minutes due to rain.", severity=IncidentSeverity.HIGH, category="CONGESTION", lat=37.7720, lon=-122.4055),
            Alert(title="Accident Hotspot Warning", message="High risk detected at Bengaluru Silk Board / Hosur Highway junction during rush hour.", severity=IncidentSeverity.CRITICAL, category="ACCIDENT", lat=12.9172, lon=77.6228),
        ]
        db.add_all(alerts)

        db.commit()
        print("[SUCCESS] Clean corridor database successfully seeded across San Francisco, Bengaluru, NYC, London & Tokyo!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
