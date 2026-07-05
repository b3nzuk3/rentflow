from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.db.models import LeaseStatus


class LeaseBase(BaseModel):
    monthly_rent: int
    security_deposit: int = 0
    start_date: str
    end_date: str


class LeaseCreate(LeaseBase):
    tenant_id: str
    unit_id: str


class LeaseUpdate(BaseModel):
    monthly_rent: Optional[int] = None
    security_deposit: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[LeaseStatus] = None


class LeaseResponse(BaseModel):
    id: str
    organization_id: str
    tenant_id: str
    unit_id: str
    monthly_rent: int
    security_deposit: int
    start_date: str
    end_date: str
    status: LeaseStatus
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'organization_id', 'tenant_id', 'unit_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v

    class Config:
        from_attributes = True
