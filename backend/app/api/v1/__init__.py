from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as organizations_router
from app.api.v1.properties import router as properties_router
from app.api.v1.blocks import router as blocks_router
from app.api.v1.units import router as units_router
from app.api.v1.tenants import router as tenants_router
from app.api.v1.leases import router as leases_router
from app.api.v1.payments import router as payments_router
from app.api.v1.users import router as users_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.audit import router as audit_router
from app.api.v1.reports import router as reports_router
from app.api.v1.invitations import router as invitations_router

__all__ = [
    "auth_router",
    "organizations_router",
    "properties_router",
    "blocks_router",
    "units_router",
    "tenants_router",
    "leases_router",
    "payments_router",
    "users_router",
    "notifications_router",
    "audit_router",
    "reports_router",
    "invitations_router",
]
