"""
Gmail Integration Router
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import httpx
import base64
import json

from app.database import get_db
from app.routers.users import get_current_user
from app.routers.google import get_google_token # Reuse common token logic
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

GMAIL_API_URL = "https://gmail.googleapis.com/gmail/v1/users/me"

class EmailMessage(BaseModel):
    id: str
    threadId: str
    snippet: str
    sender: str  # From header
    subject: str # Subject header
    date: str    # Date header

class EmailDraft(BaseModel):
    to: str
    subject: str
    body: str

async def fetch_gmail_emails(access_token: str, limit: int = 10) -> List[EmailMessage]:
    """Fetch recent emails from Gmail"""
    async with httpx.AsyncClient() as client:
        # 1. List messages
        list_res = await client.get(
            f"{GMAIL_API_URL}/messages",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"maxResults": limit, "q": "category:primary"} # Focus on primary inbox
        )
        
        if list_res.status_code != 200:
            logger.error(f"Gmail List Error: {list_res.text}")
            return []
            
        messages_data = list_res.json().get("messages", [])
        emails = []

        # 2. Get details for each message
        # In a real app, use batch request or parallel gather. 
        # For prototype simplicity, sequential is ok but parallel is better.
        # Let's try simple sequential for stability first.
        for msg_meta in messages_data:
            detail_res = await client.get(
                f"{GMAIL_API_URL}/messages/{msg_meta['id']}",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"format": "metadata", "metadataHeaders": ["From", "Subject", "Date"]}
            )
            if detail_res.status_code == 200:
                d = detail_res.json()
                headers = {h["name"]: h["value"] for h in d.get("payload", {}).get("headers", [])}
                emails.append(EmailMessage(
                    id=d["id"],
                    threadId=d["threadId"],
                    snippet=d.get("snippet", ""),
                    sender=headers.get("From", "Unknown"),
                    subject=headers.get("Subject", "(No Subject)"),
                    date=headers.get("Date", "")
                ))
        return emails

async def create_gmail_draft(access_token: str, draft: EmailDraft) -> dict:
    """Create a draft email"""
    # Create MIME message
    from email.mime.text import MIMEText
    import base64
    
    message = MIMEText(draft.body)
    message['to'] = draft.to
    message['subject'] = draft.subject
    
    # Encode as base64url
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{GMAIL_API_URL}/drafts",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"message": {"raw": raw}}
        )
        
        if res.status_code != 200:
            logger.error(f"Create Draft Error: {res.text}")
            raise HTTPException(status_code=400, detail="Failed to create draft")
            
        return res.json()


@router.get("/gmail/recent", response_model=List[EmailMessage])
async def get_recent_emails(
    limit: int = 10,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    token = await get_google_token(user.id, db)
    return await fetch_gmail_emails(token, limit)

@router.post("/gmail/drafts")
async def create_draft(
    draft: EmailDraft,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    token = await get_google_token(user.id, db)
    return await create_gmail_draft(token, draft)
