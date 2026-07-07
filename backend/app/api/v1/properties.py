from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid as uuid_lib

from app.db.database import get_db
from app.db.models import Property, UserRole
from app.core.security import get_current_user, require_roles, get_user_property_filter
from app.schemas.properties import PropertyCreate, PropertyUpdate, PropertyResponse
from app.services.audit_service import log_action

router = APIRouter(redirect_slashes=False)


@router.get("/", response_model=list[PropertyResponse])
async def list_properties(
    org_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(Property)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.where(Property.organization_id == current_user.organization_id)
    elif org_id:
        query = query.where(Property.organization_id == org_id)
    # Filter by assigned properties for non-owner roles
    prop_ids = await get_user_property_filter(current_user, db)
    if prop_ids is not None:
        if not prop_ids:
            return []
        query = query.where(Property.id.in_(prop_ids))
    result = await db.execute(query.order_by(Property.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=PropertyResponse)
async def create_property(
    data: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    import uuid
    prop = Property(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        name=data.name,
        location=data.location,
        description=data.description,
    )
    db.add(prop)
    await db.flush()
    await log_action(db, current_user.organization_id, current_user.id, "CREATE_PROPERTY", "Property", new_value=f"{data.name} ({data.location})")
    return prop


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Property).where(Property.id == uuid_lib.UUID(property_id)))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    data: PropertyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    result = await db.execute(select(Property).where(Property.id == uuid_lib.UUID(property_id)))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(prop, field, value)
    await db.flush()
    await db.refresh(prop)
    change_desc = ", ".join(f"{k}={v}" for k, v in changes.items())
    await log_action(db, current_user.organization_id, current_user.id, "UPDATE_PROPERTY", "Property", previous_value=prop.name, new_value=change_desc)
    return prop


@router.delete("/{property_id}")
async def delete_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    result = await db.execute(select(Property).where(Property.id == uuid_lib.UUID(property_id)))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop_name = prop.name
    await db.delete(prop)
    await log_action(db, current_user.organization_id, current_user.id, "DELETE_PROPERTY", "Property", previous_value=prop_name)
    return {"detail": "Property deleted"}
