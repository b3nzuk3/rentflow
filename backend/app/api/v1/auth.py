from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import User, Organization, UserRole
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token
)
from app.schemas.auth import (
    LoginRequest, LoginResponse, SignupRequest,
    TokenRefreshRequest, TokenResponse
)

router = APIRouter(redirect_slashes=False)


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )

    token_data = {"sub": str(user.id), "role": user.role.value, "org_id": str(user.organization_id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role.value,
        first_name=user.first_name,
        last_name=user.last_name,
        organization_id=user.organization_id,
    )


@router.post("/signup", response_model=LoginResponse)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Verify organization exists
    org_result = await db.execute(select(Organization).where(Organization.id == request.organization_id))
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=400, detail="Invalid organization")

    # Check email not already used
    existing = await db.execute(select(User).where(User.email == request.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        organization_id=request.organization_id,
        first_name=request.first_name,
        last_name=request.last_name,
        email=request.email.lower(),
        phone_number=request.phone_number,
        password_hash=get_password_hash(request.password),
        role=UserRole.ORG_OWNER,
    )
    db.add(user)
    await db.flush()

    token_data = {"sub": str(user.id), "role": user.role.value, "org_id": str(user.organization_id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role.value,
        first_name=user.first_name,
        last_name=user.last_name,
        organization_id=user.organization_id,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: TokenRefreshRequest):
    payload = decode_token(request.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    new_access = create_access_token({"sub": payload["sub"], "role": payload["role"], "org_id": payload["org_id"]})
    new_refresh = create_refresh_token({"sub": payload["sub"], "role": payload["role"], "org_id": payload["org_id"]})

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)
