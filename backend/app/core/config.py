from pydantic_settings import BaseSettings
from typing import ClassVar
import os


class Settings(BaseSettings):
    app_name: str = "AseEsta Ops"
    app_version: str = "2.0.0"
    demo_mode: bool = True
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/email_classifier"
    database_pool_size: int = 20
    database_max_overflow: int = 10
    database_echo: bool = False

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    google_login_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/login"

    gmail_credentials_dir: str = "credentials"
    gmail_redirect_uri: str = "http://localhost:8000/api/v1/gmail/callback"
    gmail_scopes: str = "https://mail.google.com/,https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/gmail.labels"

    gemini_api_key: str = ""

    sync_interval_seconds: int = 300
    sync_on_auth: bool = True
    sync_max_batch: int = 200

    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_period: int = 60

    log_level: str = "DEBUG"
    log_format: str = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    log_file: str = "logs/app.log"
    log_rotation: str = "10 MB"
    log_retention: str = "30 days"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": False, "extra": "ignore"}

    @property
    def scopes_list(self) -> list[str]:
        return [s.strip() for s in self.gmail_scopes.split(",")]

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()
