import os
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "URBAN-SHIELD AI"
    PROJECT_CODENAME: str = "URBAN-SHIELD-AI"
    TAGLINE: str = "Predict Traffic. Prevent Risk. Move Smarter."
    API_V1_STR: str = "/api"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-only-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

    # Database (PostgreSQL/PostGIS or SQLite fallback)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./urbanshield.db")
    ALLOW_DB_RESET: bool = os.getenv("ALLOW_DB_RESET", "false").lower() in {"1", "true", "yes"}

    # External APIs
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
    OPENWEATHER_API_KEY: Optional[str] = os.getenv("OPENWEATHER_API_KEY", "")
    TRAFFIC_API_KEY: Optional[str] = os.getenv("TRAFFIC_API_KEY", "")
    MAPBOX_TOKEN: Optional[str] = os.getenv("MAPBOX_TOKEN", "")

    # Target City Configuration (Default: San Francisco / Bay Area)
    CITY_NAME: str = os.getenv("CITY_NAME", "San Francisco")
    CITY_LAT: float = float(os.getenv("CITY_LAT", "37.7749"))
    CITY_LON: float = float(os.getenv("CITY_LON", "-122.4194"))
    CITY_BOUNDS: dict = {
        "min_lat": 37.70,
        "max_lat": 37.82,
        "min_lon": -122.52,
        "max_lon": -122.36,
    }

    # Demo Mode Toggle
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() in {"1", "true", "yes"}

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
