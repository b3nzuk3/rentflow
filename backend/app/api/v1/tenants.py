from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def tenants_health():
    return {"status": "ok", "service": "tenants"}
