from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
from app.db.models import LeaseStatus


class LeaseBase(BaseModel):
    monthly_rent: int
    security_deposit: int = 0
    start_date: str
    end_date: str


class LeaseCreate(LeaseBase):
    tenant_id: UUID
    unit_id: UUID


class LeaseUpdate(BaseModel):
    monthly_rent: Optional[int] = None
    security_deposit: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[LeaseStatus] = None


class LeaseResponse(BaseModel):
    id: UUID
    organization_id: UUID
    tenant_id: UUID
    unit_id: UUID
    monthly_rent: int
    security_deposit: int
    start_date: str
    end_date: str
    status: LeaseStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
