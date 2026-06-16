from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime
from app.db.models import UnitStatus


class UnitBase(BaseModel):
    unit_code: str
    rent_amount: int = 0
    status: UnitStatus = UnitStatus.VACANT


class UnitCreate(UnitBase):
    property_id: UUID
    block_id: Optional[UUID] = None


class UnitUpdate(BaseModel):
    unit_code: Optional[str] = None
    rent_amount: Optional[int] = None
    status: Optional[UnitStatus] = None
    block_id: Optional[UUID] = None


class UnitStatusUpdate(BaseModel):
    status: UnitStatus


class UnitResponse(BaseModel):
    id: UUID
    organization_id: UUID
    property_id: UUID
    block_id: Optional[UUID]
    unit_code: str
    rent_amount: int
    status: UnitStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
