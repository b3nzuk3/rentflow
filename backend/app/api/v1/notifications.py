from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.db.models import Notification
from app.core.security import get_current_user

router = APIRouter(redirect_slashes=False)


@router.get("/")
async def list_notifications(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.organization_id == current_user.organization_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
