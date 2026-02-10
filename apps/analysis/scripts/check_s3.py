
import logging
import sys
from pathlib import Path

# Add the project root to the Python path
# This is necessary to import modules from the analysis package
sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))

from analysis.services.s3_client import S3Client
from analysis.settings import settings

# Configure basic logging to see output from the S3Client
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def main() -> None:
    """Checks the S3 connection using the S3Client and prints the result."""
    logger.info("Attempting to connect to S3 with the following settings:")
    logger.info("Endpoint: %s", settings.s3_endpoint)
    logger.info("Region: %s", settings.s3_region)
    logger.info("Bucket: %s", settings.s3_bucket_name)
    logger.info("Access Key ID set: %s", bool(settings.s3_access_key_id))

    is_connected, message = S3Client.check_connection()

    if is_connected:
        logger.info("S3 Connection Check: SUCCESS")
        print(f"✅ {message}")  # noqa: T201
    else:
        logger.error("S3 Connection Check: FAILED")
        print(f"❌ {message}")  # noqa: T201
        sys.exit(1)

if __name__ == "__main__":
    main()
