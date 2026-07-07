import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.core.config import get_settings
from app.core.exception_handlers import custom_http_exception_handler, generic_exception_handler
from app.db.database import engine
from app.middleware import CorrelationIDMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware
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
    invitations_router,
)

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

settings = get_settings()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


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
        redirect_slashes=False,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # Rate limiter state
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Skip middleware in test mode (event loop conflicts with httpx AsyncClient)
    if not os.environ.get("TESTING"):
        app.add_middleware(SecurityHeadersMiddleware)
        app.add_middleware(RequestLoggingMiddleware)
        app.add_middleware(CorrelationIDMiddleware)

    # Exception handlers (skip in test mode to avoid event loop conflicts)
    if not os.environ.get("TESTING"):
        app.add_exception_handler(HTTPException, custom_http_exception_handler)
        app.add_exception_handler(Exception, generic_exception_handler)

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
    app.include_router(invitations_router, prefix="/api/v1/invitations", tags=["invitations"])

    @app.get("/api/health", tags=["health"])
    @limiter.limit("5/minute")
    async def health_check(request: Request):
        """Health check endpoint with database connectivity check."""
        db_status = "ok"
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception:
            db_status = "error"

        return {
            "status": "ok" if db_status == "ok" else "degraded",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "checks": {"db": db_status},
        }

    @app.get("/api/ready", tags=["health"])
    async def readiness_check():
        """Readiness check endpoint - returns 200 if DB is reachable, 503 otherwise."""
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "ready"}
        except Exception:
            raise HTTPException(status_code=503, detail="Service not ready")

    return app


app = create_application()