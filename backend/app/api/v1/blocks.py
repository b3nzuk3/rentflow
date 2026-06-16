from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.database import get_db
from app.db.models import Block, UserRole
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("/")
async def list_blocks(property_id: UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(Block).where(Block.property_id == property_id))
    return result.scalars().all()


@router.post("/")
async def create_block(property_id: UUID, name: str, db: AsyncSession = Depends(get_db),
                       current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    block = Block(property_id=property_id, name=name)
    db.add(block)
    await db.flush()
    return {"id": str(block.id), "name": block.name, "property_id": str(block.property_id)}


@router.delete("/{block_id}")
async def delete_block(block_id: UUID, db: AsyncSession = Depends(get_db),
                       current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    result = await db.execute(select(Block).where(Block.id == block_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    await db.delete(block)
    return {"detail": "Block deleted"}
