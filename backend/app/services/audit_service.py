from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import AuditLog
from uuid import UUID
from typing import Optional


async def log_action(
    db: AsyncSession,
    organization_id: UUID,
    user_id: Optional[UUID],
    action: str,
    entity: str,
    previous_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = None,
):
    log = AuditLog(
        organization_id=organization_id,
        user_id=user_id,
        action=action,
        entity=entity,
        previous_value=previous_value,
        new_value=new_value,
        ip_address=ip_address,
    )
    db.add(log)
