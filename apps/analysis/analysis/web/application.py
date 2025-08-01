from importlib import metadata

import sentry_sdk
from fastapi import FastAPI
from fastapi.responses import UJSONResponse

from analysis.settings import settings
from analysis.web.api.router import api_router
from analysis.web.lifespan import lifespan_setup


def get_app() -> FastAPI:

    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            # Add data like request headers and IP for users,
            # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
            send_default_pii=True,
        )

    """
    Get FastAPI application.

    This is the main constructor of an application.

    :return: application.
    """
    app = FastAPI(
        title="analysis",
        version=metadata.version("analysis"),
        lifespan=lifespan_setup,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        default_response_class=UJSONResponse,
    )

    # Main router for the API.
    app.include_router(router=api_router, prefix="/api")

    return app
