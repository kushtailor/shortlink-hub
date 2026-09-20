"""App settings loaded from environment variables (.env)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SECRET_KEY: str = "dev-only-change-me-min-32-chars-long!!"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = "sqlite:///./shortlink.db"
    FRONTEND_URL: str = "http://localhost:5173"
    IP_HASH_SALT: str = "dev-salt-change-me"


settings = Settings()
