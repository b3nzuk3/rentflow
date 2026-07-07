import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Invitation, Tenant, User, UserRole, Lease, Unit
from app.core.security import get_password_hash
from app.core.config import get_settings
from app.schemas.invitations import (
    InvitationValidateResponse,
    InvitationActivateRequest,
)
from app.services.audit_service import log_action

settings = get_settings()
router = APIRouter()


@router.get("/validate", response_model=InvitationValidateResponse)
async def validate_invitation(token: str, db: AsyncSession = Depends(get_db)):
    """Validate an invitation token and return details for the activation page."""
    result = await db.execute(select(Invitation).where(Invitation.token == token))
    invitation = result.scalar_one_or_none()

    if not invitation:
        return InvitationValidateResponse(valid=False, error="Invalid invitation link")

    if invitation.expires_at and invitation.expires_at < datetime.now(timezone.utc):
        return InvitationValidateResponse(valid=False, error="This invitation link has expired")

    # Check if user already activated
    existing = await db.execute(select(User).where(User.email == invitation.email))
    if existing.scalar_one_or_none():
        return InvitationValidateResponse(valid=False, error="An account with this email already exists")

    # Get tenant info
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == invitation.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    tenant_name = f"{tenant.first_name} {tenant.last_name}" if tenant else None

    return InvitationValidateResponse(
        valid=True,
        email=invitation.email,
        tenant_name=tenant_name,
        property_name=invitation.property_name,
        unit_code=invitation.unit_code,
        expires_at=invitation.expires_at,
    )


@router.post("/activate")
async def activate_invitation(
    data: InvitationActivateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Activate a tenant account using an invitation token and set password."""
    # Validate token
    result = await db.execute(select(Invitation).where(Invitation.token == data.token))
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=400, detail="Invalid invitation link")

    if invitation.expires_at and invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This invitation link has expired")

    # Check existing user
    existing = await db.execute(select(User).where(User.email == invitation.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # Get tenant
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == invitation.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant profile not found")

    # Create user account
    first_name = data.first_name or tenant.first_name
    last_name = data.last_name or tenant.last_name
    user = User(
        id=str(uuid.uuid4()),
        organization_id=invitation.organization_id,
        first_name=first_name,
        last_name=last_name,
        email=invitation.email.lower(),
        phone_number=invitation.phone or tenant.phone_number,
        password_hash=get_password_hash(data.password),
        role=UserRole.TENANT,
        is_active=True,
    )
    db.add(user)

    # Update tenant status to Active
    from app.db.models import TenantStatus, LeaseStatus
    tenant.status = TenantStatus.ACTIVE

    # Activate the associated lease (find by tenant_id and set to Active)
    lease_result = await db.execute(
        select(Lease).where(
            Lease.tenant_id == tenant.id,
            Lease.organization_id == invitation.organization_id,
            Lease.status == LeaseStatus.DRAFT,
        )
    )
    lease = lease_result.scalar_one_or_none()
    if lease:
        lease.status = LeaseStatus.ACTIVE

        # Update unit status to Occupied
        from app.db.models import UnitStatus
        unit_result = await db.execute(select(Unit).where(Unit.id == lease.unit_id))
        unit = unit_result.scalar_one_or_none()
        if unit:
            unit.status = UnitStatus.OCCUPIED

    await db.flush()

    await log_action(
        db,
        str(invitation.organization_id),
        str(user.id),
        "ACTIVATE_TENANT",
        "Tenant",
        previous_value="Invited",
        new_value=f"Active — {tenant.first_name} {tenant.last_name}",
    )

    return {
        "detail": "Account activated successfully. You can now log in.",
        "email": user.email,
    }
