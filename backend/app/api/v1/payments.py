from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Payment, Lease, Tenant, UserRole, PaymentStatus
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
    import uuid
    from app.db.models import Tenant, Lease

    # If tenant, verify the lease belongs to them
    if current_user.role == UserRole.TENANT:
        # Find tenant profile by email
        tenant_result = await db.execute(
            select(Tenant).where(
                Tenant.organization_id == current_user.organization_id,
                Tenant.email == current_user.email,
            )
        )
        tenant = tenant_result.scalar_one_or_none()
        if not tenant:
            raise HTTPException(status_code=403, detail="Tenant profile not found")

        # Verify the lease belongs to this tenant
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
        # Landlord/manager can submit on behalf of any tenant
        submitted_by = data.submitted_by or f"{current_user.first_name} {current_user.last_name}"

    # Check for duplicate transaction code
    existing = await db.execute(
        select(Payment).where(Payment.transaction_code == data.transaction_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Transaction code already used")

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
    )
    db.add(payment)
    await db.flush()
    await log_action(db, current_user.organization_id, current_user.id, "SUBMIT_PAYMENT", "Payment", new_value=f"KSh {data.amount} ({data.payment_method}) — {data.transaction_code}")
    return payment


@router.patch("/{payment_id}/verify", response_model=PaymentResponse)
async def verify_payment(
    payment_id: str,
    data: PaymentVerify,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER, UserRole.ACCOUNTANT)),
):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    old_status = payment.status.value if hasattr(payment.status, 'value') else str(payment.status)
    payment.status = data.status
    payment.verification_notes = data.verification_notes
    payment.verified_by = current_user.email
    await db.flush()
    await db.refresh(payment)
    new_status = data.status.value if hasattr(data.status, 'value') else str(data.status)
    await log_action(db, current_user.organization_id, current_user.id, "VERIFY_PAYMENT", "Payment", previous_value=old_status, new_value=f"{new_status} — KSh {payment.amount} (verified by {current_user.email})")
    return payment


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
