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
