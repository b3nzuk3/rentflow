from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.db.models import UserRole


class UserBase(BaseModel):
    first_name: str
    last_name: str
    phone_number: str
    email: EmailStr
    role: UserRole


class UserCreate(UserBase):
    organization_id: str
    password: str


class UserResponse(BaseModel):
    id: str
    organization_id: str
    first_name: str
    last_name: str
    phone_number: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    assigned_property_ids: list[str] = []

    @field_validator('id', 'organization_id', mode='before')
    @classmethod
    def _convert_uuid(cls, v):
        return str(v) if v is not None else v

    class Config:
        from_attributes = True


class UserInvite(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    role: UserRole
    property_ids: list[str] = []


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters")
        return v
