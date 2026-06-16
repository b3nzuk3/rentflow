from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["health"])
async def leases_health():
    return {"status": "ok", "service": "leases"}
