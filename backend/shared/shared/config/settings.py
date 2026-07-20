from typing import Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

import os

class BaseAppSettings(BaseSettings):
    """
    Base configuration class for all MuleShield AI microservices.
    Enforces strict Pydantic v2 validation for environment variables.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General App Config
    ENV: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    PROJECT_NAME: str = Field(default="MuleShield AI")
    LOG_LEVEL: str = Field(default="INFO")
    
    # CORS & Security
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:3000", "http://127.0.0.1:3000"])
    
    # PostgreSQL Configuration
    POSTGRES_DB: str = Field(default="muleshield")
    POSTGRES_USER: str = Field(default="postgres")
    POSTGRES_PASSWORD: str = Field(default="postgres_secure_pass")
    POSTGRES_HOST: str = Field(default="postgres")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_POOL_SIZE: int = Field(default=20)
    POSTGRES_MAX_OVERFLOW: int = Field(default=10)

    # MongoDB Configuration
    MONGODB_URI: str = Field(default="mongodb://mongodb:27017/muleshield")
    MONGODB_DB_NAME: str = Field(default="muleshield")

    # Neo4j Configuration
    NEO4J_URI: str = Field(default="bolt://neo4j:7687")
    NEO4J_USER: str = Field(default="neo4j")
    NEO4J_PASSWORD: str = Field(default="muleshield_neo4j_pass")

    # Redis Configuration
    REDIS_URL: str = Field(default="redis://redis:6379/0")

    # Microservices URLs
    INGESTION_SERVICE_URL: str = Field(default="http://ingestion-service:8000")
    DETECTION_ENGINE_URL: str = Field(default="http://detection-engine:8000")
    REPORTING_SERVICE_URL: str = Field(default="http://reporting-service:8000")
    ANTHROPIC_API_KEY: str | None = Field(default=None)

    # JWT Authentication Configuration
    # In production, these should be supplied via container secrets/env
    JWT_SECRET_KEY: str = Field(default="super_secret_jwt_key_should_be_changed_in_prod_muleshield_12345!")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15)
    REFRESH_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)  # 24 hours
    MFA_ISSUER: str = Field(default="MuleShieldAI")

    # Database Provider Overrides (for zero-dependency local runs)
    USE_SQLITE: bool = Field(default=True, description="If True, falls back to SQLite file database to avoid Postgres server requirement")

    @property
    def async_postgres_url(self) -> str:
        """
        Dynamically constructs the async PostgreSQL or SQLite connection string.
        """
        if self.USE_SQLITE:
            # Construct dynamic absolute path to root directory: backend/shared/shared/config/settings.py
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
            db_path = os.path.join(root_dir, "muleshield.db")
            # Replace backslashes with forward slashes for SQLAlchemy compatibility
            db_path = db_path.replace("\\", "/")
            return f"sqlite+aiosqlite:///{db_path}"
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        """
        Allows list conversion from comma-separated string format.
        """
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
