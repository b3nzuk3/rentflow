from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Tenant, UserRole, Lease, Unit, Property
from app.core.security import get_current_user, require_roles
from app.schemas.tenants import TenantCreate, TenantUpdate, TenantResponse
from app.services.audit_service import log_action

router = APIRouter(redirect_slashes=False)


@router.get("/me")
async def get_my_tenant_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get the tenant profile for the currently logged-in user (matched by email)."""
    if current_user.role != UserRole.TENANT:
        raise HTTPException(status_code=403, detail="Only tenants can access this endpoint")
    result = await db.execute(
        select(Tenant).where(
            Tenant.organization_id == current_user.organization_id,
            Tenant.email == current_user.email,
        )
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant profile not found")
    return tenant


@router.get("/me/leases")
async def get_my_leases(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all leases for the currently logged-in tenant, with unit and property info."""
    if current_user.role != UserRole.TENANT:
        raise HTTPException(status_code=403, detail="Only tenants can access this endpoint")
    # Find tenant profile by email
    tenant_result = await db.execute(
        select(Tenant).where(
            Tenant.organization_id == current_user.organization_id,
            Tenant.email == current_user.email,
        )
    )
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant profile not found")

    # Fetch leases with unit and property
    leases_result = await db.execute(
        select(Lease).where(Lease.tenant_id == tenant.id).order_by(Lease.created_at.desc())
    )
    leases = leases_result.scalars().all()

    # Build response with nested unit/property
    result = []
    for lease in leases:
        unit = await db.get(Unit, lease.unit_id)
        prop = await db.get(Property, unit.property_id) if unit else None
        result.append({
            "lease": {
                "id": lease.id,
                "monthly_rent": lease.monthly_rent,
                "security_deposit": lease.security_deposit,
                "start_date": lease.start_date,
                "end_date": lease.end_date,
                "status": lease.status.value,
            },
            "unit": {
                "id": unit.id,
                "unit_code": unit.unit_code,
                "rent_amount": unit.rent_amount,
                "status": unit.status.value,
            } if unit else None,
            "property": {
                "id": prop.id,
                "name": prop.name,
                "location": prop.location,
            } if prop else None,
        })
    return result


@router.get("/me/payments")
async def get_my_payments(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all payments for the currently logged-in tenant."""
    if current_user.role != UserRole.TENANT:
        raise HTTPException(status_code=403, detail="Only tenants can access this endpoint")
    from app.db.models import Payment
    tenant_result = await db.execute(
        select(Tenant).where(
            Tenant.organization_id == current_user.organization_id,
            Tenant.email == current_user.email,
        )
    )
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant profile not found")

    leases_result = await db.execute(select(Lease.id).where(Lease.tenant_id == tenant.id))
    lease_ids = [r for r in leases_result.scalars().all()]
    if not lease_ids:
        return []

    payments_result = await db.execute(
        select(Payment).where(Payment.lease_id.in_(lease_ids)).order_by(Payment.created_at.desc())
    )
    return payments_result.scalars().all()


@router.get("/", response_model=list[TenantResponse])
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


@router.post("/", response_model=TenantResponse)
async def create_tenant(
    data: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    import uuid
    tenant = Tenant(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone_number=data.phone_number,
        email=data.email,
        national_id=data.national_id,
    )
    db.add(tenant)
    await db.flush()
    await log_action(db, current_user.organization_id, current_user.id, "CREATE_TENANT", "Tenant", new_value=f"{data.first_name} {data.last_name} ({data.email})")
    return tenant


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.patch("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(tenant_id: str, data: TenantUpdate, db: AsyncSession = Depends(get_db),
                        current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(tenant, field, value)
    await db.flush()
    await db.refresh(tenant)
    change_desc = ", ".join(f"{k}={v}" for k, v in changes.items())
    await log_action(db, current_user.organization_id, current_user.id, "UPDATE_TENANT", "Tenant", previous_value=f"{tenant.first_name} {tenant.last_name}", new_value=change_desc)
    return tenant
