from fastapi import Security
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter

from analysis.web.api.datasets.routes import router as dataset_router
from analysis.web.api.health import router as health_router
from analysis.web.api.security import get_api_key

api_router = APIRouter()


@api_router.get("/", response_class=JSONResponse)
async def root(api_key: str = Security(get_api_key)) -> dict[str, str]:
    """Root endpoint returning API information."""
    return {"__self": "root"}


api_router.include_router(health_router)
api_router.include_router(dataset_router)
