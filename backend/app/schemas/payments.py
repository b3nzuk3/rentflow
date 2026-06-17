from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.db.models import PaymentStatus, PaymentMethod


class PaymentCreate(BaseModel):
    lease_id: str
    amount: int
    payment_method: PaymentMethod
    transaction_code: str
    payment_date: str
    submitted_by: str
    verification_notes: Optional[str] = None
    receipt_attachment: Optional[str] = None


class PaymentVerify(BaseModel):
    status: PaymentStatus
    verification_notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    organization_id: str
    lease_id: str
    amount: int
    payment_method: PaymentMethod
    transaction_code: str
    payment_date: str
    submitted_by: str
    verified_by: Optional[str]
    verification_notes: Optional[str]
    status: PaymentStatus
    receipt_attachment: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
