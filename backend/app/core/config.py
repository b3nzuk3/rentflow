from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "RentFlow"
    APP_VERSION: str = "1.0.0"
    DATABASE_URL: str = "postgresql+asyncpg://rentflow:rentflow@localhost:5432/rentflow"
    REDIS_URL: str = "redis://localhost:password@localhost:6379/0"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7


@lru_cache()
def get_settings() -> Settings:
    return Settings()
