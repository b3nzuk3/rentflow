from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: str
    organization_id: str
    user_id: Optional[str]
    action: str
    entity: str
    previous_value: Optional[str]
    new_value: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    @field_validator('id', 'organization_id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        return str(v) if v is not None else v

    class Config:
        from_attributes = True
