from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.database import get_db
from app.db.models import Tenant, Lease, Unit, UserRole, UnitStatus, LeaseStatus
from app.core.security import get_current_user, require_roles
from app.schemas.tenants import TenantCreate, TenantUpdate, TenantResponse
from app.schemas.leases import LeaseCreate, LeaseUpdate, LeaseResponse

router = APIRouter()

# --- Tenants ---

@router.get("/tenants", response_model=list[TenantResponse])
async def list_tenants(
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(Tenant).where(Tenant.organization_id == current_user.organization_id)
    if status:
        query = query.where(Tenant.status == status)
    result = await db.execute(query.order_by(Tenant.created_at.desc()))
    return result.scalars().all()


@router.post("/tenants", response_model=TenantResponse)
async def create_tenant(
    data: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    tenant = Tenant(
        organization_id=current_user.organization_id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone_number=data.phone_number,
        email=data.email,
        national_id=data.national_id,
    )
    db.add(tenant)
    await db.flush()
    return tenant


@router.get("/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.patch("/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(tenant_id: UUID, data: TenantUpdate, db: AsyncSession = Depends(get_db),
                        current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tenant, field, value)
    await db.flush()
    return tenant


# --- Leases ---

@router.get("/leases", response_model=list[LeaseResponse])
async def list_leases(status: str = None, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    query = select(Lease).where(Lease.organization_id == current_user.organization_id)
    if status:
        query = query.where(Lease.status == status)
    result = await db.execute(query.order_by(Lease.created_at.desc()))
    return result.scalars().all()


@router.post("/leases", response_model=LeaseResponse)
async def create_lease(data: LeaseCreate, db: AsyncSession = Depends(get_db),
                       current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    # Set unit to Reserved
    unit_result = await db.execute(select(Unit).where(Unit.id == data.unit_id))
    unit = unit_result.scalar_one_or_none()
    if unit:
        unit.status = UnitStatus.RESERVED

    lease = Lease(
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


@router.patch("/leases/{lease_id}/sign", response_model=LeaseResponse)
async def sign_lease(lease_id: UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Lease).where(Lease.id == lease_id))
    lease = result.scalar_one_or_none()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    lease.status = LeaseStatus.ACTIVE
    # Set unit to Occupied
    unit_result = await db.execute(select(Unit).where(Unit.id == lease.unit_id))
    unit = unit_result.scalar_one_or_none()
    if unit:
        unit.status = UnitStatus.OCCUPIED
    await db.flush()
    return lease


@router.patch("/leases/{lease_id}", response_model=LeaseResponse)
async def update_lease(lease_id: UUID, data: LeaseUpdate, db: AsyncSession = Depends(get_db),
                       current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    result = await db.execute(select(Lease).where(Lease.id == lease_id))
    lease = result.scalar_one_or_none()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lease, field, value)
    await db.flush()
    return lease
