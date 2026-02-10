from datetime import datetime
from typing import Any, Dict, Tuple

from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from analysis.db.dependencies import get_db_session
from analysis.services.s3_client import S3Client
from analysis.settings import settings

router = APIRouter(tags=["health"])


async def check_database_health(db: AsyncSession) -> Tuple[bool, str]:
    """Check if the database connection is working.

    Returns:
        A tuple of (is_connected, message)
    """
    try:
        # Execute a simple query to check database connection
        await db.execute(text("SELECT 1"))
        return True, "Successfully connected to database"
    except Exception as e:
        return False, f"Database connection error: {e!s}"


def get_health_status() -> Tuple[Dict[str, Any], int]:
    """
    Check the health of all services and return status information.

    Returns:
        Tuple containing (health_status_dict, status_code)
    """
    try:
        # Initialize services status
        services = {}
        all_healthy = True

        # Test S3 connection
        s3_connected, s3_message = S3Client.check_connection()
        services["s3"] = {
            "connected": s3_connected,
            "message": s3_message,
        }

        if not s3_connected:
            all_healthy = False

        # Database check will be done in the endpoint handler
        # since it requires an async context

        status_code = 200 if all_healthy else 503

        health_status = {
            "status": "healthy" if all_healthy else "unhealthy",
            "services": services,
        }

        return health_status, status_code

    except Exception as e:
        error_status = {
            "status": "error",
            "error": str(e),
            "services": {
                "s3": {
                    "connected": False,
                    "message": f"Error: {e!s}",
                    "endpoint": settings.s3_endpoint,
                    "bucket": settings.s3_bucket_name,
                    "region": settings.s3_region,
                },
                "database": {
                    "connected": False,
                    "message": f"Error during health check: {e!s}",
                },
            },
        }
        return error_status, 500


@router.get("/health")
async def health_check(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
) -> Dict[str, Any]:
    """
    Health check endpoint that verifies the status of all dependencies.
    Returns 200 if all services are healthy, 503 if any service is down.
    """
    # Get initial health status (without database check)
    health_status, status_code = get_health_status()

    # Check database connection
    db_connected, db_message = await check_database_health(db)

    # Update health status with database info
    health_status["services"]["database"] = {
        "connected": db_connected,
        "message": db_message,
    }

    # Update overall status if database is not connected
    if not db_connected and status_code == 200:
        health_status["status"] = "unhealthy"
        status_code = 503

    # Add timestamp
    health_status["timestamp"] = datetime.now()

    return health_status
