from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Lease, Unit, UserRole, UnitStatus, LeaseStatus
from app.core.security import get_current_user, require_roles
from app.schemas.leases import LeaseCreate, LeaseUpdate, LeaseResponse

router = APIRouter()


@router.get("/", response_model=list[LeaseResponse])
async def list_leases(status: str = None, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    query = select(Lease).where(Lease.organization_id == current_user.organization_id)
    if status:
        query = query.where(Lease.status == status)
    result = await db.execute(query.order_by(Lease.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=LeaseResponse)
async def create_lease(data: LeaseCreate, db: AsyncSession = Depends(get_db),
                       current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    unit_result = await db.execute(select(Unit).where(Unit.id == data.unit_id))
    unit = unit_result.scalar_one_or_none()
    if unit:
        unit.status = UnitStatus.RESERVED

    import uuid
    lease = Lease(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        tenant_id=data.tenant_id,
        unit_id=data.unit_id,
        monthly_rent=data.monthly_rent,
        security_deposit=data.security_deposit,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(lease)
    await db.flush()
    return lease


@router.patch("/{lease_id}/sign", response_model=LeaseResponse)
async def sign_lease(lease_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Lease).where(Lease.id == lease_id))
    lease = result.scalar_one_or_none()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    lease.status = LeaseStatus.ACTIVE
    unit_result = await db.execute(select(Unit).where(Unit.id == lease.unit_id))
    unit = unit_result.scalar_one_or_none()
    if unit:
        unit.status = UnitStatus.OCCUPIED
    await db.flush()
    return lease


@router.patch("/{lease_id}", response_model=LeaseResponse)
async def update_lease(lease_id: str, data: LeaseUpdate, db: AsyncSession = Depends(get_db),
                       current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    result = await db.execute(select(Lease).where(Lease.id == lease_id))
    lease = result.scalar_one_or_none()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lease, field, value)
    await db.flush()
    return lease
