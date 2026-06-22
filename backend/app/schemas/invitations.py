from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class InvitationCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    tenant_id: str
    unit_id: str
    property_name: str
    unit_code: str


class InvitationValidateResponse(BaseModel):
    valid: bool
    email: Optional[str] = None
    tenant_name: Optional[str] = None
    property_name: Optional[str] = None
    unit_code: Optional[str] = None
    expires_at: Optional[datetime] = None
    error: Optional[str] = None


class InvitationActivateRequest(BaseModel):
    token: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
