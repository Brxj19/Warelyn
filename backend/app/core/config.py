from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="WARELYN_",
        case_sensitive=False,
    )

    app_name: str = "Warelyn Inventory API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True
    api_prefix: str = "/api"

    database_url: str = "mysql+pymysql://warelyn:warelyn_dev_password@localhost:3306/warelyn_inventory"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"])

    jwt_secret_key: str = "change-this-dev-secret-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14

    super_admin_email: str = "admin@warelyn.local"
    super_admin_password: str = "ChangeMe123!"
    super_admin_name: str = "Warelyn Super Admin"
    seed_super_admin_on_startup: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
