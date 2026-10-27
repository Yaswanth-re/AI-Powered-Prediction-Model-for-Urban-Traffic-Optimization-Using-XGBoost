from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.session import Base

class UserRole(str, enum.Enum):
    COMMUTER = "COMMUTER"
    EMERGENCY_RESPONDER = "EMERGENCY_RESPONDER"
    CITY_AUTHORITY = "CITY_AUTHORITY"
    ADMIN = "ADMIN"

class IncidentSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentConfidence(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERIFIED = "VERIFIED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.COMMUTER, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    road_type = Column(String(100), nullable=False) # Expressway, Arterial, Local, Highway
    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lon = Column(Float, nullable=False)
    path_coordinates = Column(JSON, nullable=False) # List of [lat, lon] points
    length_km = Column(Float, nullable=False)
    capacity_vph = Column(Integer, default=2000) # Vehicles per hour
    speed_limit_kmh = Column(Float, default=60.0)
    lanes = Column(Integer, default=2)
    accident_frequency_historical = Column(Float, default=0.0)
    is_intersection = Column(Boolean, default=False)
    has_signals = Column(Boolean, default=True)
    
    # Live dynamic metrics
    current_speed_kmh = Column(Float, default=45.0)
    current_volume_vph = Column(Integer, default=800)
    current_congestion_pct = Column(Float, default=25.0) # 0 to 100%
    current_safety_score = Column(Float, default=85.0) # 0 to 100
    current_risk_level = Column(String(50), default="LOW")
    weather_impact_factor = Column(Float, default=1.0)
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    traffic_records = relationship("TrafficRecord", back_populates="segment")
    predictions = relationship("TrafficPrediction", back_populates="segment")
    accidents = relationship("AccidentRecord", back_populates="segment")

class TrafficRecord(Base):
    __tablename__ = "traffic_records"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    speed_kmh = Column(Float, nullable=False)
    volume_vph = Column(Integer, nullable=False)
    density_vpk = Column(Float, nullable=False) # Vehicles per km
    congestion_pct = Column(Float, nullable=False)
    rainfall_mm = Column(Float, default=0.0)
    visibility_m = Column(Float, default=10000.0)
    is_weekend = Column(Boolean, default=False)
    is_rush_hour = Column(Boolean, default=False)

    segment = relationship("RoadSegment", back_populates="traffic_records")

class TrafficPrediction(Base):
    __tablename__ = "traffic_predictions"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=False, index=True)
    horizon_minutes = Column(Integer, nullable=False) # 15, 30, 60, 120
    predicted_speed_kmh = Column(Float, nullable=False)
    predicted_congestion_pct = Column(Float, nullable=False)
    predicted_volume_vph = Column(Integer, nullable=False)
    confidence_lower_pct = Column(Float, nullable=False)
    confidence_upper_pct = Column(Float, nullable=False)
    model_name = Column(String(100), default="XGBoost v1.4")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    segment = relationship("RoadSegment", back_populates="predictions")

class AccidentRecord(Base):
    __tablename__ = "accident_records"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True, index=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    severity = Column(SQLEnum(IncidentSeverity), default=IncidentSeverity.MEDIUM, nullable=False)
    vehicles_involved = Column(Integer, default=2)
    weather_condition = Column(String(100), default="Clear")
    lighting_condition = Column(String(100), default="Daylight")
    contributing_factors = Column(JSON, default=list) # e.g. ["Speeding", "Rain", "Heavy Congestion"]

    segment = relationship("RoadSegment", back_populates="accidents")

class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    radius_meters = Column(Float, default=300.0)
    boundary_polygon = Column(JSON, nullable=False) # List of [lat, lon]
    accident_count_30d = Column(Integer, default=0)
    high_severity_count = Column(Integer, default=0)
    risk_score = Column(Float, default=75.0) # 0 to 100
    peak_risk_hours = Column(String(100), default="17:00 - 20:00")
    primary_road_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    temperature_c = Column(Float, default=20.0)
    rainfall_mm = Column(Float, default=0.0)
    humidity_pct = Column(Float, default=65.0)
    visibility_m = Column(Float, default=10000.0)
    wind_speed_kmh = Column(Float, default=12.0)
    condition = Column(String(100), default="Clear")
    severe_weather_alert = Column(Boolean, default=False)

class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False) # Accident, Pothole, Closure, Flooding, Signal Malfunction
    description = Column(Text, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    road_name = Column(String(255), nullable=True)
    severity = Column(SQLEnum(IncidentSeverity), default=IncidentSeverity.MEDIUM)
    confidence = Column(SQLEnum(IncidentConfidence), default=IncidentConfidence.MEDIUM)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    upvotes = Column(Integer, default=1)
    ai_classification_tag = Column(String(100), nullable=True)

class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    algorithm = Column(String(100), nullable=False) # XGBoost, Random Forest, LSTM, DBSCAN
    version = Column(String(50), nullable=False)
    task = Column(String(100), nullable=False) # Traffic Prediction, Risk Classification, Hotspot Clustering
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    trained_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    features_used = Column(JSON, default=list)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(SQLEnum(IncidentSeverity), default=IncidentSeverity.MEDIUM)
    category = Column(String(100), default="TRAFFIC") # CONGESTION, ACCIDENT, WEATHER, EMERGENCY
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    road_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_read = Column(Boolean, default=False)

class RouteObservation(Base):
    __tablename__ = "route_observations"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    city = Column(String(100), default="Chennai", index=True)
    origin_name = Column(String(255), nullable=False)
    destination_name = Column(String(255), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    duration_with_traffic_sec = Column(Float, nullable=False)
    duration_static_sec = Column(Float, nullable=False)
    estimated_delay_sec = Column(Float, default=0.0)
    provider = Column(String(100), default="Google Maps Routes API")
    is_live = Column(Boolean, default=True)
    data_quality = Column(String(50), default="HIGH")
    status = Column(String(50), default="SUCCESS")

