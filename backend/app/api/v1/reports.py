from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def reports_health():
    return {"status": "ok", "service": "reports"}
