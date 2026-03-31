import asyncio
import time
from typing import Any, Dict, Tuple

from fastapi import APIRouter, Depends
from loguru import logger
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from analysis.db.dependencies import get_db_session
from analysis.services.s3_client import S3Client

router = APIRouter(tags=["health"])


def _build_service_result(
    *,
    connected: bool,
    duration_ms: int,
) -> dict[str, Any]:
    return {
        "connected": connected,
        "duration_ms": duration_ms,
    }


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


async def _check_s3_health() -> dict[str, Any]:
    started_at = time.monotonic()

    try:
        s3_connected, s3_message = await asyncio.to_thread(S3Client.check_connection)
        if not s3_connected:
            logger.error("S3 health check failed: {}", s3_message)

        return _build_service_result(
            connected=s3_connected,
            duration_ms=round((time.monotonic() - started_at) * 1000),
        )
    except Exception:
        logger.exception("S3 health check failed")
        return _build_service_result(
            connected=False,
            duration_ms=round((time.monotonic() - started_at) * 1000),
        )


async def _check_database_health(db: AsyncSession) -> dict[str, Any]:
    started_at = time.monotonic()
    db_connected, db_message = await check_database_health(db)
    if not db_connected:
        logger.error("Database health check failed: {}", db_message)

    return _build_service_result(
        connected=db_connected,
        duration_ms=round((time.monotonic() - started_at) * 1000),
    )


@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db_session),
) -> Dict[str, Any]:
    """
    Health check endpoint that verifies the status of all dependencies.
    Always returns HTTP 200 and encodes the overall result in the JSON
    ``status`` field (``healthy`` or ``unhealthy``) together with
    per-service availability timings.
    """
    started_at = time.monotonic()
    database_result, s3_result = await asyncio.gather(
        _check_database_health(db),
        _check_s3_health(),
    )

    services = {
        "database": database_result,
        "s3": s3_result,
    }

    all_healthy = all(service["connected"] for service in services.values())

    return {
        "status": "healthy" if all_healthy else "unhealthy",
        "services": services,
        "duration_ms": round((time.monotonic() - started_at) * 1000),
    }
