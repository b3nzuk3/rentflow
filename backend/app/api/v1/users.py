from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import User, UserRole
from app.core.security import get_current_user, require_roles, get_password_hash
from app.schemas.users import UserResponse, UserInvite, UserUpdate
from app.services.audit_service import log_action

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
    await log_action(db, current_user.organization_id, current_user.id, "INVITE_USER", "User", new_value=f"{data.first_name} {data.last_name} ({data.email}) — Role: {data.role.value}")
    return user


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No fields to update")
    # Check email uniqueness if changing email
    if "email" in changes:
        existing = await db.execute(select(User).where(User.email == changes["email"].lower(), User.id != current_user.id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
        changes["email"] = changes["email"].lower()
    for field, value in changes.items():
        setattr(current_user, field, value)
    await db.flush()
    await db.refresh(current_user)
    change_desc = ", ".join(f"{k}={v}" for k, v in changes.items())
    await log_action(db, current_user.organization_id, current_user.id, "UPDATE_USER_PROFILE", "User", previous_value=f"{current_user.first_name} {current_user.last_name}", new_value=change_desc)
    return current_user


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
    status = "Active" if user.is_active else "Suspended"
    await log_action(db, current_user.organization_id, current_user.id, "TOGGLE_USER_STATUS", "User", previous_value=str(not user.is_active), new_value=f"{status} — {user.first_name} {user.last_name}")
    return {"id": str(user.id), "is_active": user.is_active}
