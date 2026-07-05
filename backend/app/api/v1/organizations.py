from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid as uuid_lib

from app.db.database import get_db
from app.db.models import Organization, UserRole
from app.core.security import get_current_user, require_roles
from app.schemas.organizations import (
    OrganizationCreate, OrganizationUpdate, OrganizationResponse
)
from app.services.audit_service import log_action

router = APIRouter(redirect_slashes=False)


@router.get("/me", response_model=OrganizationResponse)
async def get_my_organization(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Organization).where(Organization.id == uuid_lib.UUID(org_id)))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ORG_OWNER)),
):
    result = await db.execute(select(Organization).where(Organization.id == uuid_lib.UUID(org_id)))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)
    await db.flush()
    await db.refresh(org)
    change_desc = ", ".join(f"{k}={v}" for k, v in update_data.items())
    await log_action(db, current_user.organization_id, current_user.id, "UPDATE_ORGANIZATION", "Organization", previous_value=org.name, new_value=change_desc)
    return org
