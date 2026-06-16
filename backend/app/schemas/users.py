from pydantic import BaseModel, EmailStr
from uuid import UUID
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
    organization_id: UUID
    password: str


class UserResponse(BaseModel):
    id: UUID
    organization_id: UUID
    first_name: str
    last_name: str
    phone_number: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserInvite(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    role: UserRole
