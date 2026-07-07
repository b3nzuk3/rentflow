from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid as uuid_lib

from app.db.database import get_db
from app.db.models import Unit, UserRole
from app.core.security import get_current_user, require_roles, get_user_property_filter
from app.schemas.units import UnitCreate, UnitUpdate, UnitStatusUpdate, UnitResponse
from app.services.audit_service import log_action

router = APIRouter(redirect_slashes=False)


@router.get("/", response_model=list[UnitResponse])
async def list_units(
    property_id: Optional[str] = Query(None),
    block_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(Unit)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.where(Unit.organization_id == current_user.organization_id)
    if property_id:
        query = query.where(Unit.property_id == property_id)
    if block_id:
        query = query.where(Unit.block_id == block_id)
    if status:
        query = query.where(Unit.status == status)
    # Filter by assigned properties for non-owner roles
    prop_ids = await get_user_property_filter(current_user, db)
    if prop_ids is not None:
        if not prop_ids:
            return []
        query = query.where(Unit.property_id.in_(prop_ids))
    result = await db.execute(query.order_by(Unit.unit_code))
    return result.scalars().all()


@router.post("/", response_model=UnitResponse)
async def create_unit(
    data: UnitCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    unit = Unit(
        id=str(uuid_lib.uuid4()),
        organization_id=current_user.organization_id,
        property_id=data.property_id,
        block_id=data.block_id,
        unit_code=data.unit_code,
        rent_amount=data.rent_amount,
        status=data.status,
    )
    db.add(unit)
    await db.flush()
    await log_action(db, current_user.organization_id, current_user.id, "CREATE_UNIT", "Unit", new_value=f"{data.unit_code} (KSh {data.rent_amount})")
    return unit


@router.get("/{unit_id}", response_model=UnitResponse)
async def get_unit(
    unit_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Unit).where(Unit.id == uuid_lib.UUID(unit_id)))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.patch("/{unit_id}", response_model=UnitResponse)
async def update_unit(
    unit_id: str,
    data: UnitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    result = await db.execute(select(Unit).where(Unit.id == uuid_lib.UUID(unit_id)))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(unit, field, value)
    await db.flush()
    await db.refresh(unit)
    change_desc = ", ".join(f"{k}={v}" for k, v in changes.items())
    await log_action(db, current_user.organization_id, current_user.id, "UPDATE_UNIT", "Unit", previous_value=unit.unit_code, new_value=change_desc)
    return unit


@router.patch("/{unit_id}/status", response_model=UnitResponse)
async def update_unit_status(
    unit_id: str,
    data: UnitStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Unit).where(Unit.id == uuid_lib.UUID(unit_id)))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    old_status = unit.status.value if hasattr(unit.status, 'value') else str(unit.status)
    unit.status = data.status
    await db.flush()
    await db.refresh(unit)
    new_status = data.status.value if hasattr(data.status, 'value') else str(data.status)
    await log_action(db, current_user.organization_id, current_user.id, "UPDATE_UNIT_STATUS", "Unit", previous_value=f"{old_status} — {unit.unit_code}", new_value=new_status)
    return unit


@router.delete("/{unit_id}")
async def delete_unit(
    unit_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    result = await db.execute(select(Unit).where(Unit.id == uuid_lib.UUID(unit_id)))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    unit_code = unit.unit_code
    await db.delete(unit)
    await log_action(db, current_user.organization_id, current_user.id, "DELETE_UNIT", "Unit", previous_value=unit_code)
    return {"detail": "Unit deleted"}
