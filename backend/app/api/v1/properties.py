from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional

from app.db.database import get_db
from app.db.models import Property, Organization, UserRole
from app.core.security import get_current_user, require_roles
from app.schemas.properties import PropertyCreate, PropertyUpdate, PropertyResponse

router = APIRouter()


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
    result = await db.execute(query.order_by(Property.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=PropertyResponse)
async def create_property(
    data: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    prop = Property(
        organization_id=current_user.organization_id,
        name=data.name,
        location=data.location,
        description=data.description,
    )
    db.add(prop)
    await db.flush()
    return prop


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Property).where(Property.id == property_id))
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
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)
    await db.flush()
    return prop


@router.delete("/{property_id}")
async def delete_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    await db.delete(prop)
    return {"detail": "Property deleted"}
