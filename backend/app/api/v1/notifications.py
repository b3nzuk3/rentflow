from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def notifications_health():
    return {"status": "ok", "service": "notifications"}
