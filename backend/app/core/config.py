from typing import Optional
from pydantic import BaseSettings
import os


class Settings(BaseSettings):
    # App settings
    app_name: str = "Aldacore"
    version: str = "1.0.0"
    debug: bool = False
    
    # Database settings
    database_url: str = "postgresql://aldacore:aldacore123@postgres:5432/aldacore"
    
    # Security settings
    secret_key: str = "aldacore-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS settings
    allowed_origins: list[str] = ["http://localhost:3000", "http://frontend:3000"]
    
    # ML settings
    use_mock_predictions: bool = True
    prediction_confidence_threshold: float = 0.7
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()