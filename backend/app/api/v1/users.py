from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from collections import defaultdict
import uuid as uuid_lib

from app.db.database import get_db
from app.db.models import User, UserRole, UserProperty
from app.core.security import get_current_user, require_roles, get_password_hash
from app.schemas.users import UserResponse, UserInvite, UserUpdate
from app.services.audit_service import log_action

router = APIRouter(redirect_slashes=False)


@router.get("/", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    # Fetch property assignments for all users
    user_ids = [u.id for u in users]
    prop_result = await db.execute(
        select(UserProperty).where(UserProperty.user_id.in_(user_ids))
    )
    assignments = prop_result.scalars().all()
    user_props = defaultdict(list)
    for a in assignments:
        user_props[str(a.user_id)].append(str(a.property_id))

    # Build responses with assigned_property_ids
    responses = []
    for u in users:
        resp = UserResponse.model_validate(u)
        resp.assigned_property_ids = user_props.get(str(u.id), [])
        responses.append(resp)
    return responses


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
        password_hash=get_password_hash("changeme123"),
        role=data.role,
    )
    db.add(user)
    await db.flush()

    # Assign properties if provided
    for pid in data.property_ids:
        up = UserProperty(user_id=user.id, property_id=uuid_lib.UUID(pid))
        db.add(up)

    await log_action(db, current_user.organization_id, current_user.id, "INVITE_USER", "User", new_value=f"{data.first_name} {data.last_name} ({data.email}) — Role: {data.role.value}")
    await db.flush()
    await db.refresh(user)

    resp = UserResponse.model_validate(user)
    resp.assigned_property_ids = data.property_ids
    return resp


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Include assigned properties
    result = await db.execute(
        select(UserProperty.property_id).where(UserProperty.user_id == current_user.id)
    )
    prop_ids = [str(row[0]) for row in result.all()]
    resp = UserResponse.model_validate(current_user)
    resp.assigned_property_ids = prop_ids
    return resp


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

    # Include assigned properties
    result = await db.execute(
        select(UserProperty.property_id).where(UserProperty.user_id == current_user.id)
    )
    prop_ids = [str(row[0]) for row in result.all()]
    resp = UserResponse.model_validate(current_user)
    resp.assigned_property_ids = prop_ids
    return resp


@router.patch("/{user_id}/toggle")
async def toggle_user_active(user_id: str, db: AsyncSession = Depends(get_db),
                              current_user=Depends(require_roles(UserRole.ORG_OWNER, UserRole.PROPERTY_MANAGER))):
    result = await db.execute(select(User).where(User.id == uuid_lib.UUID(user_id)))
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


@router.patch("/{user_id}/properties")
async def update_user_properties(
    user_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ORG_OWNER)),
):
    """Update property assignments for a user."""
    result = await db.execute(select(User).where(User.id == uuid_lib.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not your organization")

    # Remove existing assignments
    existing = await db.execute(select(UserProperty).where(UserProperty.user_id == user.id))
    for up in existing.scalars().all():
        await db.delete(up)

    # Add new assignments
    property_ids = data.get("property_ids", [])
    for pid in property_ids:
        up = UserProperty(user_id=user.id, property_id=uuid_lib.UUID(pid))
        db.add(up)

    await db.flush()
    await log_action(db, current_user.organization_id, current_user.id, "UPDATE_USER_PROPERTIES", "User", new_value=f"Assigned {len(property_ids)} properties to {user.first_name} {user.last_name}")
    return {"user_id": user_id, "property_ids": property_ids}
