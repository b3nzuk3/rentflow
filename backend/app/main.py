from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.v1 import (
    auth_router,
    organizations_router,
    properties_router,
    blocks_router,
    units_router,
    tenants_router,
    leases_router,
    payments_router,
    users_router,
    notifications_router,
    audit_router,
    reports_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - startup and shutdown hooks."""
    # Startup: initialize DB pools, Redis connections, etc.
    yield
    # Shutdown: close connections gracefully


def create_application() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="RentFlow V1 - Multi-tenant SaaS Property Management Platform",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include all v1 routers
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(organizations_router, prefix="/api/v1/organizations", tags=["organizations"])
    app.include_router(properties_router, prefix="/api/v1/properties", tags=["properties"])
    app.include_router(blocks_router, prefix="/api/v1/blocks", tags=["blocks"])
    app.include_router(units_router, prefix="/api/v1/units", tags=["units"])
    app.include_router(tenants_router, prefix="/api/v1/tenants", tags=["tenants"])
    app.include_router(leases_router, prefix="/api/v1/leases", tags=["leases"])
    app.include_router(payments_router, prefix="/api/v1/payments", tags=["payments"])
    app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
    app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])
    app.include_router(audit_router, prefix="/api/v1/audit", tags=["audit"])
    app.include_router(reports_router, prefix="/api/v1/reports", tags=["reports"])

    @app.get("/api/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}

    return app


app = create_application()
