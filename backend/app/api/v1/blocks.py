from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.db.database import get_db
from app.db.models import Block, UserRole
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("/")
async def list_blocks(property_id: Optional[str] = Query(None), db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    query = select(Block)
    if property_id:
        query = query.where(Block.property_id == property_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/")
async def create_block(property_id: str, name: str, db: AsyncSession = Depends(get_db),
                       current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    import uuid
    block = Block(id=str(uuid.uuid4()), property_id=property_id, name=name)
    db.add(block)
    await db.flush()
    return {"id": str(block.id), "name": block.name, "property_id": str(block.property_id)}


@router.delete("/{block_id}")
async def delete_block(block_id: str, db: AsyncSession = Depends(get_db),
                       current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    result = await db.execute(select(Block).where(Block.id == block_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    await db.delete(block)
    return {"detail": "Block deleted"}
