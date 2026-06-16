from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def payments_health():
    return {"status": "ok", "service": "payments"}
