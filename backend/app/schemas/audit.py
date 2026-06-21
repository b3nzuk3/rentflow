from pydantic import BaseModel
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

    class Config:
        from_attributes = True
