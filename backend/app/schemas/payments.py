from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.db.models import PaymentStatus, PaymentMethod, PaymentType


class PaymentCreate(BaseModel):
    lease_id: str
    amount: int
    payment_method: PaymentMethod
    transaction_code: str
    payment_date: str
    submitted_by: Optional[str] = None
    verification_notes: Optional[str] = None
    receipt_attachment: Optional[str] = None
    # Billing period tracking
    payment_type: PaymentType = PaymentType.MONTHLY
    billing_period: Optional[str] = None  # Format: "YYYY-MM"


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
    payment_type: PaymentType
    billing_period: Optional[str]
    period_start: Optional[str]
    period_end: Optional[str]
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'organization_id', 'lease_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v

    class Config:
        from_attributes = True
