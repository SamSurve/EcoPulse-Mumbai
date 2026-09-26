import os
from typing import List, Any, Optional
from pydantic import Field

def _safe_int(val: Any, default: int) -> int:
    if not val:
        return default
    try:
        return int(str(val).strip())
    except (ValueError, TypeError):
        return default


class FallbackSettings:
    PORT: int = _safe_int(os.getenv("PORT"), 8000)
    HOST: str = os.getenv("HOST") or "0.0.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT") or "development"
    OPENAQ_API_KEY: str = os.getenv("OPENAQ_API_KEY") or ""
    CACHE_TTL_SECONDS: int = _safe_int(os.getenv("CACHE_TTL_SECONDS"), 900)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS") or "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL") or "INFO"
    HTTP_TIMEOUT_SECONDS: int = _safe_int(os.getenv("HTTP_TIMEOUT_SECONDS"), 5)
    MAX_CACHE_SIZE: int = _safe_int(os.getenv("MAX_CACHE_SIZE"), 1000)

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        PORT: int = Field(default=8000)
        HOST: str = Field(default="0.0.0.0")
        ENVIRONMENT: str = Field(default="development")
        OPENAQ_API_KEY: str = Field(default="")
        CACHE_TTL_SECONDS: int = Field(default=900)
        CORS_ORIGINS: str = Field(default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000")
        LOG_LEVEL: str = Field(default="INFO")
        HTTP_TIMEOUT_SECONDS: int = Field(default=5)
        MAX_CACHE_SIZE: int = Field(default=1000)

        model_config = {
            "env_file": ".env",
            "env_file_encoding": "utf-8",
            "extra": "ignore"
        }

        @property
        def cors_origins_list(self) -> List[str]:
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    settings = Settings()

except ImportError:
    settings = FallbackSettings()

