from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.db.models import UnitStatus


class UnitBase(BaseModel):
    unit_code: str
    rent_amount: int = 0
    status: UnitStatus = UnitStatus.VACANT


class UnitCreate(UnitBase):
    property_id: str
    block_id: Optional[str] = None


class UnitUpdate(BaseModel):
    unit_code: Optional[str] = None
    rent_amount: Optional[int] = None
    status: Optional[UnitStatus] = None
    block_id: Optional[str] = None


class UnitStatusUpdate(BaseModel):
    status: UnitStatus


class UnitResponse(BaseModel):
    id: str
    organization_id: str
    property_id: str
    block_id: Optional[str]
    unit_code: str
    rent_amount: int
    status: UnitStatus
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'organization_id', 'property_id', 'block_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v

    class Config:
        from_attributes = True
