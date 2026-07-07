from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.db.models import Property, Unit, Lease, Payment
from app.core.security import get_current_user, get_user_property_filter

router = APIRouter(redirect_slashes=False)


@router.get("/summary")
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    org_id = current_user.organization_id

    # Get assigned property IDs (None for org_owner = no filter)
    prop_ids = await get_user_property_filter(current_user, db)

    def unit_filter(col=Unit.id):
        filters = [Unit.organization_id == org_id]
        if prop_ids is not None:
            if not prop_ids:
                return False  # No access
            filters.append(Unit.property_id.in_(prop_ids))
        return filters

    def lease_filter():
        filters = [Lease.organization_id == org_id, Lease.status == "Active"]
        if prop_ids is not None:
            if not prop_ids:
                return False
            filters.append(Lease.unit_id.in_(
                select(Unit.id).where(Unit.organization_id == org_id, Unit.property_id.in_(prop_ids))
            ))
        return filters

    def payment_filter():
        filters = [Payment.organization_id == org_id, Payment.status == "Verified"]
        if prop_ids is not None:
            if not prop_ids:
                return False
            filters.append(Payment.lease_id.in_(
                select(Lease.id).join(Unit, Lease.unit_id == Unit.id).where(
                    Lease.organization_id == org_id, Unit.property_id.in_(prop_ids)
                )
            ))
        return filters

    def pending_payment_filter():
        filters = [Payment.organization_id == org_id, Payment.status == "Pending"]
        if prop_ids is not None:
            if not prop_ids:
                return False
            filters.append(Payment.lease_id.in_(
                select(Lease.id).join(Unit, Lease.unit_id == Unit.id).where(
                    Lease.organization_id == org_id, Unit.property_id.in_(prop_ids)
                )
            ))
        return filters

    def property_count_filter():
        filters = [Property.organization_id == org_id]
        if prop_ids is not None:
            if not prop_ids:
                return 0
            filters.append(Property.id.in_(prop_ids))
        return filters

    # Total units
    uf = unit_filter()
    if uf is False:
        return {"total_properties": 0, "total_units": 0, "occupied_units": 0, "vacant_units": 0, "occupancy_rate": 0, "expected_rent": 0, "collected_rent": 0, "outstanding_rent": 0, "pending_payments": 0}

    units_result = await db.execute(select(func.count(Unit.id)).where(*uf))
    total_units = units_result.scalar()

    # Occupied units
    occupied_filters = uf + [Unit.status == "Occupied"]
    occupied_result = await db.execute(select(func.count(Unit.id)).where(*occupied_filters))
    occupied_units = occupied_result.scalar()

    # Expected rent from active leases
    lf = lease_filter()
    if lf is not False:
        leases_result = await db.execute(select(func.sum(Lease.monthly_rent)).where(*lf))
        expected_rent = leases_result.scalar() or 0
    else:
        expected_rent = 0

    # Collected rent (verified payments)
    pf = payment_filter()
    if pf is not False:
        collected_result = await db.execute(select(func.sum(Payment.amount)).where(*pf))
        collected_rent = collected_result.scalar() or 0
    else:
        collected_rent = 0

    # Pending payments count
    ppf = pending_payment_filter()
    if ppf is not False:
        pending_result = await db.execute(select(func.count(Payment.id)).where(*ppf))
        pending_payments = pending_result.scalar()
    else:
        pending_payments = 0

    # Properties count
    pcf = property_count_filter()
    if isinstance(pcf, int):
        total_properties = pcf
    else:
        props_result = await db.execute(select(func.count(Property.id)).where(*pcf))
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
