from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.db.models import Property, Unit, Lease, Payment, UserRole
from app.core.security import get_current_user

router = APIRouter(redirect_slashes=False)


@router.get("/summary")
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    org_id = current_user.organization_id

    # Total units
    units_result = await db.execute(
        select(func.count(Unit.id)).where(Unit.organization_id == org_id)
    )
    total_units = units_result.scalar()

    # Occupied units
    occupied_result = await db.execute(
        select(func.count(Unit.id)).where(Unit.organization_id == org_id, Unit.status == "Occupied")
    )
    occupied_units = occupied_result.scalar()

    # Expected rent from active leases
    leases_result = await db.execute(
        select(func.sum(Lease.monthly_rent)).where(Lease.organization_id == org_id, Lease.status == "Active")
    )
    expected_rent = leases_result.scalar() or 0

    # Collected rent (verified payments)
    collected_result = await db.execute(
        select(func.sum(Payment.amount)).where(
            Payment.organization_id == org_id, Payment.status == "Verified"
        )
    )
    collected_rent = collected_result.scalar() or 0

    # Pending payments count
    pending_result = await db.execute(
        select(func.count(Payment.id)).where(
            Payment.organization_id == org_id, Payment.status == "Pending"
        )
    )
    pending_payments = pending_result.scalar()

    # Properties count
    props_result = await db.execute(
        select(func.count(Property.id)).where(Property.organization_id == org_id)
    )
    total_properties = props_result.scalar()

    occupancy_rate = 0
    if total_units > 0:
        occupancy_rate = round((occupied_units / total_units) * 100)

    return {
        "total_properties": total_properties,
        "total_units": total_units,
        "occupied_units": occupied_units,
        "vacant_units": total_units - occupied_units,
        "occupancy_rate": occupancy_rate,
        "expected_rent": expected_rent,
        "collected_rent": collected_rent,
        "outstanding_rent": max(0, expected_rent - collected_rent),
        "pending_payments": pending_payments,
    }
