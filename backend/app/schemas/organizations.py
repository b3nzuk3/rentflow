from pydantic import BaseModel
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


class OrganizationResponse(OrganizationBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
