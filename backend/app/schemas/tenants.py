from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.db.models import TenantStatus


class TenantBase(BaseModel):
    first_name: str
    last_name: str
    phone_number: str
    email: EmailStr
    national_id: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    national_id: Optional[str] = None
    status: Optional[TenantStatus] = None


class TenantResponse(BaseModel):
    id: str
    organization_id: str
    first_name: str
    last_name: str
    phone_number: str
    email: str
    national_id: Optional[str]
    status: TenantStatus
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'organization_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v

    class Config:
        from_attributes = True


class TenantInviteRequest(BaseModel):
    # Tenant details
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    national_id: Optional[str] = None
    # Lease details
    unit_id: str
    monthly_rent: float
    security_deposit: float
    start_date: str
    end_date: str


class TenantInviteResponse(BaseModel):
    tenant: TenantResponse
    lease_id: str
    invitation_token: str
    invitation_link: str
    message: str

    @field_validator('lease_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v
