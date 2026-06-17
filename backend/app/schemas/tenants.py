from pydantic import BaseModel, EmailStr
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
    email: Optional[EmailStr] = None
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

    class Config:
        from_attributes = True
