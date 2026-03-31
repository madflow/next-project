import logging
from typing import Optional

from boto3.exceptions import Boto3Error
from boto3.session import Session
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import ClientError

from analysis.settings import settings

logger = logging.getLogger(__name__)

HEALTHCHECK_S3_CONNECT_TIMEOUT_SECONDS = 1
HEALTHCHECK_S3_READ_TIMEOUT_SECONDS = 2


class S3Client:
    """Singleton client for S3 storage."""

    _instance: Optional[BaseClient] = None

    @classmethod
    def get_client(cls) -> BaseClient:
        """Get a singleton instance of the S3 client."""
        if cls._instance is None:
            try:
                logger.debug(
                    "Initializing S3 client with settings: %s",
                    {
                        "region": settings.s3_region,
                        "endpoint": settings.s3_endpoint,
                        "bucket": settings.s3_bucket_name,
                        "access_key_set": bool(settings.s3_access_key_id),
                    },
                )

                session = Session(
                    aws_access_key_id=settings.s3_access_key_id,
                    aws_secret_access_key=settings.s3_secret_access_key,
                    region_name=settings.s3_region,
                )

                endpoint_url = settings.s3_endpoint

                client_config = {
                    "service_name": "s3",
                    "config": Config(signature_version="s3v4"),
                }

                client_config["endpoint_url"] = endpoint_url
                logger.debug("Using local S3 endpoint: %s", endpoint_url)

                cls._instance = session.client(**client_config)
                logger.debug("S3 client initialized successfully")

            except Exception:
                logger.exception("Failed to initialize S3 client")
                raise

        return cls._instance

    @classmethod
    def get_healthcheck_client(cls) -> BaseClient:
        """Build a dedicated S3 client with short timeouts for health checks."""
        session = Session(
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
            region_name=settings.s3_region,
        )

        return session.client(
            service_name="s3",
            endpoint_url=settings.s3_endpoint,
            config=Config(
                signature_version="s3v4",
                connect_timeout=HEALTHCHECK_S3_CONNECT_TIMEOUT_SECONDS,
                read_timeout=HEALTHCHECK_S3_READ_TIMEOUT_SECONDS,
                retries={"max_attempts": 1, "mode": "standard"},
            ),
        )

    @classmethod
    def check_connection(cls) -> tuple[bool, str]:
        """Check if the S3 connection is working.

        Returns:
            A tuple of (is_connected, message)
        """
        try:
            if not settings.s3_bucket_name.strip():
                return False, "S3 bucket name is not configured"
            client = cls.get_healthcheck_client()
            client.head_bucket(Bucket=settings.s3_bucket_name)
            return True, "Successfully connected to S3 bucket"
        except (Boto3Error, ClientError) as e:
            return False, f"Failed to connect to S3: {e!s}"
        except Exception as e:
            return False, f"Unexpected error while connecting to S3: {e!s}"
