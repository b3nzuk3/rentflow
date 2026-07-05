from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.db.models import SubscriptionPlan


class OrganizationBase(BaseModel):
    name: str
    subscription_plan: SubscriptionPlan = SubscriptionPlan.STARTER


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    subscription_plan: Optional[SubscriptionPlan] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    tax_pin: Optional[str] = None
    reg_number: Optional[str] = None
    business_type: Optional[str] = None
    logo_url: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    id: str
    is_active: bool
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    tax_pin: Optional[str] = None
    reg_number: Optional[str] = None
    business_type: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v

    class Config:
        from_attributes = True
