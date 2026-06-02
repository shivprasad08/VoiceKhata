from fastapi import APIRouter

router = APIRouter(prefix="/api/udhar", tags=["Udhar"])

@router.get("")
async def get_udhar_records():
    return {"message": "Udhar records endpoint (placeholder)"}
