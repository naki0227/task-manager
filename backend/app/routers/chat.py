"""
Chat Router
AI Chat Interface
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.users import get_current_user

from app.services.gemini_service import get_gemini_service

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Chat with Vision AI
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    user = get_current_user(authorization, db)
    service = get_gemini_service()
    
    try:
        response_text = await service.chat(request.message, user_id=user.id, db=db)
        return ChatResponse(response=response_text)
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="AIサービスの呼び出しに失敗しました")


class AIActivity(BaseModel):
    id: int
    type: str # folder, file, summary, analysis
    message: str
    timestamp: str


@router.get("/ai-activities", response_model=list[dict])
async def get_ai_activities(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get recent AI activities (Real Data)
    """
    user = get_current_user(authorization, db)
    
    # Needs to match frontend interface: id, type, message, timestamp
    from app.models import AIActivity
    from datetime import datetime
    
    activities = db.query(AIActivity).filter(
        AIActivity.user_id == user.id
    ).order_by(AIActivity.created_at.desc()).limit(20).all()
    
    result = []
    for act in activities:
        # Calculate naive "X minutes ago"
        diff = datetime.utcnow() - act.created_at
        minutes = int(diff.total_seconds() / 60)
        
        if minutes < 1:
            timestamp = "今"
        elif minutes < 60:
            timestamp = f"{minutes}分前"
        elif minutes < 1440:
            timestamp = f"{int(minutes/60)}時間前"
        else:
            timestamp = f"{int(minutes/1440)}日前"
            
        result.append({
            "id": act.id,
            "type": act.type or "analysis",
            "message": act.message,
            "timestamp": timestamp
        })
        
    return result
