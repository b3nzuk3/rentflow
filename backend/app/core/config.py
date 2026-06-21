from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://rentflow:rentflow@localhost:5432/rentflow"
    REDIS_URL: str = "redis://localhost:6379/0"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
