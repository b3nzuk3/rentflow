from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def units_health():
    return {"status": "ok", "service": "units"}
