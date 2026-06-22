import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Payment, Lease, Tenant, UserRole, PaymentStatus, RentSchedule, PaymentType
from app.core.security import get_current_user, require_roles
from app.schemas.payments import PaymentCreate, PaymentVerify, PaymentResponse
from app.services.audit_service import log_action

router = APIRouter(redirect_slashes=False)


@router.get("/", response_model=list[PaymentResponse])
async def list_payments(
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(Payment).where(Payment.organization_id == current_user.organization_id)
    if status:
        query = query.where(Payment.status == status)
    result = await db.execute(query.order_by(Payment.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=PaymentResponse)
async def create_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.db.models import Tenant, Lease, RentSchedule

    # If tenant, verify the lease belongs to them
    if current_user.role == UserRole.TENANT:
        tenant_result = await db.execute(
            select(Tenant).where(
                Tenant.organization_id == current_user.organization_id,
                Tenant.email == current_user.email,
            )
        )
        tenant = tenant_result.scalar_one_or_none()
        if not tenant:
            raise HTTPException(status_code=403, detail="Tenant profile not found")

        lease_result = await db.execute(
            select(Lease).where(
                Lease.id == data.lease_id,
                Lease.tenant_id == tenant.id,
            )
        )
        if not lease_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="You can only submit payments for your own lease")

        submitted_by = f"{current_user.first_name} {current_user.last_name}"
    else:
        submitted_by = data.submitted_by or f"{current_user.first_name} {current_user.last_name}"

    # Check for duplicate transaction code
    existing = await db.execute(
        select(Payment).where(Payment.transaction_code == data.transaction_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Transaction code already used")

    # Get lease details for period calculation
    lease = await db.get(Lease, data.lease_id)
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")

    # Determine billing period
    payment_type = data.payment_type
    billing_period = data.billing_period
    period_start = None
    period_end = None

    if billing_period:
        # Parse YYYY-MM format
        try:
            year, month = billing_period.split("-")
            period_start = f"{billing_period}-01"
            # Last day of month
            if month == "12":
                period_end = f"{year}-12-31"
            else:
                next_month = int(month) + 1
                last_day = (datetime(int(year), next_month, 1) - timedelta(days=1)).day
                period_end = f"{billing_period}-{last_day:02d}"
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Invalid billing_period format. Use YYYY-MM")
    else:
        # Default: use payment_date to determine period
        try:
            payment_dt = datetime.strptime(data.payment_date, "%Y-%m-%d")
            billing_period = payment_dt.strftime("%Y-%m")
            period_start = f"{billing_period}-01"
            if payment_dt.month == 12:
                period_end = f"{payment_dt.year}-12-31"
            else:
                last_day = (datetime(payment_dt.year, payment_dt.month + 1, 1) - timedelta(days=1)).day
                period_end = f"{billing_period}-{last_day:02d}"
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payment_date format. Use YYYY-MM-DD")

    # Create the payment
    payment = Payment(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        lease_id=data.lease_id,
        amount=data.amount,
        payment_method=data.payment_method,
        transaction_code=data.transaction_code,
        payment_date=data.payment_date,
        submitted_by=submitted_by,
        verification_notes=data.verification_notes,
        receipt_attachment=data.receipt_attachment,
        payment_type=payment_type,
        billing_period=billing_period,
        period_start=period_start,
        period_end=period_end,
    )
    db.add(payment)
    await db.flush()

    # Update or create rent schedule entry
    schedule_result = await db.execute(
        select(RentSchedule).where(
            RentSchedule.lease_id == data.lease_id,
            RentSchedule.billing_period == billing_period,
        )
    )
    schedule = schedule_result.scalar_one_or_none()

    if schedule:
        # Update existing schedule (payment is pending verification)
        # We update paid_amount only after verification, but track pending
        pass
    else:
        # Create new schedule entry
        due_date = f"{billing_period}-05"  # Rent due on 5th of each month
        schedule = RentSchedule(
            id=str(uuid.uuid4()),
            organization_id=current_user.organization_id,
            lease_id=data.lease_id,
            billing_period=billing_period,
            period_start=period_start,
            period_end=period_end,
            expected_amount=lease.monthly_rent,
            paid_amount=0,
            balance=lease.monthly_rent,
            status="Pending",
            due_date=due_date,
        )
        db.add(schedule)

    await db.flush()

    await log_action(
        db,
        current_user.organization_id,
        current_user.id,
        "SUBMIT_PAYMENT",
        "Payment",
        new_value=f"KSh {data.amount} ({data.payment_method}) — {data.transaction_code} — {billing_period}",
    )

    return payment


@router.patch("/{payment_id}/verify", response_model=PaymentResponse)
async def verify_payment(
    payment_id: str,
    data: PaymentVerify,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER, UserRole.ACCOUNTANT)),
):
    from app.db.models import RentSchedule

    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    old_status = payment.status.value if hasattr(payment.status, 'value') else str(payment.status)
    payment.status = data.status
    payment.verification_notes = data.verification_notes
    payment.verified_by = current_user.email

    # Update rent schedule if verified
    if data.status == PaymentStatus.VERIFIED and payment.billing_period:
        schedule_result = await db.execute(
            select(RentSchedule).where(
                RentSchedule.lease_id == payment.lease_id,
                RentSchedule.billing_period == payment.billing_period,
            )
        )
        schedule = schedule_result.scalar_one_or_none()
        if schedule:
            schedule.paid_amount += payment.amount
            schedule.balance = schedule.expected_amount - schedule.paid_amount

            # Update status based on balance
            if schedule.balance <= 0:
                schedule.status = "Paid" if schedule.balance == 0 else "Advance"
            else:
                schedule.status = "Partial"

            # If fully paid, update lease unit status to Occupied
            if schedule.balance <= 0:
                lease = await db.get(Lease, payment.lease_id)
                if lease and lease.status == "Draft":
                    from app.db.models import LeaseStatus
                    lease.status = LeaseStatus.ACTIVE

    await db.flush()
    await db.refresh(payment)
    new_status = data.status.value if hasattr(data.status, 'value') else str(data.status)
    await log_action(
        db,
        current_user.organization_id,
        current_user.id,
        "VERIFY_PAYMENT",
        "Payment",
        previous_value=old_status,
        new_value=f"{new_status} — KSh {payment.amount} (verified by {current_user.email})",
    )

    return payment


@router.get("/schedule/{lease_id}")
async def get_rent_schedule(
    lease_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get rent schedule for a lease. Tenants can only see their own."""
    from app.db.models import Lease, Tenant

    lease = await db.get(Lease, lease_id)
    if not lease:
        raise HTTPException(status_code=404, detail="Lease not found")

    # If tenant, verify ownership
    if current_user.role == UserRole.TENANT:
        tenant_result = await db.execute(
            select(Tenant).where(
                Tenant.organization_id == current_user.organization_id,
                Tenant.email == current_user.email,
            )
        )
        tenant = tenant_result.scalar_one_or_none()
        if not tenant or lease.tenant_id != tenant.id:
            raise HTTPException(status_code=403, detail="Access denied")

    schedules = await db.execute(
        select(RentSchedule).where(RentSchedule.lease_id == lease_id).order_by(RentSchedule.billing_period)
    )
    return schedules.scalars().all()
async def get_payment(payment_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
