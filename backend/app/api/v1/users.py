from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import User, UserRole
from app.core.security import get_current_user, require_roles, get_password_hash
from app.schemas.users import UserResponse, UserInvite

router = APIRouter(redirect_slashes=False)


@router.get("/", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id).order_by(User.created_at.desc())
    )
    return result.scalars().all()


@router.post("/invite", response_model=UserResponse)
async def invite_user(
    data: UserInvite,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER)),
):
    # Check email not used
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        organization_id=current_user.organization_id,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email.lower(),
        phone_number=data.phone_number,
        password_hash=get_password_hash("changeme123"),  # TODO: user must change on first login
        role=data.role,
    )
    db.add(user)
    await db.flush()
    return user


@router.patch("/{user_id}/toggle")
async def toggle_user_active(user_id: str, db: AsyncSession = Depends(get_db),
                              current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.ORG_OWNER:
        raise HTTPException(status_code=400, detail="Cannot suspend organization owner")
    user.is_active = not user.is_active
    await db.flush()
    return {"id": str(user.id), "is_active": user.is_active}
