from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.db.models import PropertyStatus


class PropertyBase(BaseModel):
    name: str
    location: str
    description: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[PropertyStatus] = None


class PropertyResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    location: str
    description: Optional[str]
    status: PropertyStatus
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'organization_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v

    class Config:
        from_attributes = True


class BlockCreate(BaseModel):
    property_id: str
    name: str
