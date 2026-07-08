from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import AuditLog
from app.core.security import get_current_user
from app.schemas.audit import AuditLogResponse

router = APIRouter(redirect_slashes=False)


@router.get("/", response_model=list[AuditLogResponse])
async def list_audit_logs(
    limit: int = 50,
    offset: int = 0,
    action: str = None,
    entity: str = None,
    search: str = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(AuditLog).where(AuditLog.organization_id == current_user.organization_id)
    if action:
        query = query.where(AuditLog.action == action)
    if entity:
        query = query.where(AuditLog.entity == entity)
    if search:
        query = query.where(
            AuditLog.action.ilike(f"%{search}%") |
            AuditLog.entity.ilike(f"%{search}%") |
            AuditLog.new_value.ilike(f"%{search}%") |
            AuditLog.previous_value.ilike(f"%{search}%")
        )
    result = await db.execute(
        query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
    )
    return result.scalars().all()


@router.get("/actions")
async def list_audit_actions(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(AuditLog.action).where(AuditLog.organization_id == current_user.organization_id).distinct()
    )
    return [row[0] for row in result.all()]


@router.get("/entities")
async def list_audit_entities(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(AuditLog.entity).where(AuditLog.organization_id == current_user.organization_id).distinct()
    )
    return [row[0] for row in result.all()]
