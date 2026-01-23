from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.users import get_current_user
from app.services.autonomy import AutonomyService

router = APIRouter()

@router.post("/autonomous/run")
async def run_autonomous_loop(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Manually trigger the Autonomous Loop.
    This will generate Proposals based on RAG context.
    """
    user = get_current_user(authorization, db)
    service = AutonomyService(db)
    count = await service.run_loop(user.id)
    return {"message": "Autonomous loop executed", "proposals_generated": count}
