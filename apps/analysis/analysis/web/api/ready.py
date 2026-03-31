from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class ReadinessResponse(BaseModel):
    status: Literal["ready"]


@router.get(
    "/ready",
    summary="Readiness check",
    response_description="Service readiness status",
    response_model=ReadinessResponse,
)
async def readiness_check() -> ReadinessResponse:
    """Lightweight readiness endpoint used by the deployment stack."""
    return ReadinessResponse(status="ready")
