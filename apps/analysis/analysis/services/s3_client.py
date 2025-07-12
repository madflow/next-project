import logging
from typing import Optional

import boto3
from boto3.exceptions import Boto3Error
from boto3.session import Session
from botocore.client import BaseClient
from botocore.exceptions import ClientError

from analysis.settings import settings

logger = logging.getLogger(__name__)

class S3Client:
    """Singleton client for S3 storage."""

    _instance: Optional[BaseClient] = None

    @classmethod
    def get_client(cls) -> BaseClient:
        """Get a singleton instance of the S3 client."""
        if cls._instance is None:
            try:
                logger.debug("Initializing S3 client with settings: %s", {
                    "region": settings.s3_region,
                    "endpoint": settings.s3_endpoint,
                    "bucket": settings.s3_bucket_name,
                    "access_key_set": bool(settings.s3_access_key_id),
                })

                session = Session(
                    aws_access_key_id=settings.s3_access_key_id,
                    aws_secret_access_key=settings.s3_secret_access_key,
                    region_name=settings.s3_region,
                )

                endpoint_url = settings.s3_endpoint
                use_local = endpoint_url and "localhost" in endpoint_url

                client_config = {
                    "service_name": "s3",
                    "config": boto3.session.Config(signature_version="s3v4"),
                }

                if use_local:
                    client_config["endpoint_url"] = endpoint_url
                    logger.debug("Using local S3 endpoint: %s", endpoint_url)
                else:
                    logger.debug("Using AWS S3 endpoint")

                cls._instance = session.client(**client_config)
                logger.debug("S3 client initialized successfully")

            except Exception:
                logger.exception("Failed to initialize S3 client")
                raise

        return cls._instance

    @classmethod
    def check_connection(cls) -> tuple[bool, str]:
        """Check if the S3 connection is working.

        Returns:
            A tuple of (is_connected, message)
        """
        try:
            client = cls.get_client()
            # Try to list buckets to verify the connection
            client.list_buckets()
            return True, "Successfully connected to S3"
        except (Boto3Error, ClientError) as e:
            return False, f"Failed to connect to S3: {e!s}"
        except Exception as e:
            return False, f"Unexpected error while connecting to S3: {e!s}"
