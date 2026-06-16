from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def audit_health():
    return {"status": "ok", "service": "audit"}
