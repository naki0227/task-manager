from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import Proposal, User, Task
from app.routers.users import get_current_user

router = APIRouter()

class ProposalResponse(BaseModel):
    id: int
    title: str
    description: str
    type: str
    payload: str
    status: str
    created_at: datetime
    
    class Config:
        orm_mode = True

@router.get("/proposals", response_model=List[ProposalResponse])
def get_pending_proposals(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    return db.query(Proposal).filter(
        Proposal.user_id == user.id,
        Proposal.status == "pending"
    ).order_by(Proposal.created_at.desc()).all()

@router.post("/proposals/{proposal_id}/approve")
async def approve_proposal(
    proposal_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.user_id == user.id).first()
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    # Async Mode: Mark as processing (Worker will update to executed/failed)
    proposal.status = "processing"
    
    # EXECUTE LOGIC (Delegated to ActionService)
    try:
        from app.services.action import ActionService
        await ActionService.execute_proposal(proposal, user, db)
        
        db.commit()
    except Exception as e:
        db.rollback()
        # Logging handled by ActionService -> EventBus
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

    return {"status": "approved", "id": proposal.id}

@router.post("/proposals/{proposal_id}/reject")
def reject_proposal(
    proposal_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.user_id == user.id).first()
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    proposal.status = "rejected"
    
    # Log Rejection
    from app.services.safety import SafetyService
    safety = SafetyService(db)
    safety.log_action(user.id, "proposal_rejected", proposal.type, {"proposal_id": proposal.id})
    
    db.commit()
    
    return {"status": "rejected", "id": proposal.id}
