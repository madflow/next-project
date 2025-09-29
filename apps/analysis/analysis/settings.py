import enum
from pathlib import Path
from tempfile import gettempdir
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from yarl import URL

TEMP_DIR = Path(gettempdir())


class LogLevel(str, enum.Enum):
    """Possible log levels."""

    NOTSET = "NOTSET"
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    FATAL = "FATAL"


class Settings(BaseSettings):
    """
    Application settings.

    These parameters can be configured
    with environment variables.
    """

    host: str = "127.0.0.1"
    port: int = 3003
    # quantity of workers for uvicorn
    workers_count: int = 1
    # Enable uvicorn reloading
    reload: bool = False

    # Current environment
    environment: str = "dev"

    log_level: LogLevel = LogLevel.DEBUG
    # Variables for the database
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "analysis"
    db_pass: str = ""
    db_base: str = ""
    db_echo: bool = False

    @property
    def db_url(self) -> URL:
        """
        Assemble database URL from settings.

        :return: database URL.
        """
        return URL.build(
            scheme="postgresql+asyncpg",
            host=self.db_host,
            port=self.db_port,
            user=self.db_user,
            password=self.db_pass,
            path=f"/{self.db_base}",
        )

    # S3 Storage settings
    s3_region: str = "us-east-1"
    s3_bucket_name: str = "app"
    s3_access_key_id: str = "s3"
    s3_secret_access_key: str = "s3"
    s3_endpoint: str = "http://localhost:7070"

    api_key: str = "your-super-secret-api-key"

    sentry_dsn: Optional[str] = None
    sentry_sample_rate: float = 1.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="ANALYSIS_",
        env_file_encoding="utf-8",
    )


settings = Settings()
