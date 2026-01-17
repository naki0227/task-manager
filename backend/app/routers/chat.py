"""
Chat Router
AI Chat Interface
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from app.services.gemini_service import get_gemini_service

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with Vision AI
    """
    service = get_gemini_service()
    try:
        response_text = await service.chat(request.message)
        return ChatResponse(response=response_text)
    except Exception as e:
        print(f"Chat Error: {e}")
        # Return a friendly error message instead of 500 if possible, or re-raise
        raise HTTPException(status_code=500, detail="AIサービスの呼び出しに失敗しました")
