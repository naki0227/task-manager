"""
Slack Integration Router
Slack messages sync and AI task extraction
"""

from fastapi import APIRouter, HTTPException, Depends, Header, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from app.database import get_db, SessionLocal
from app.models import User, OAuthToken, Task
from app.routers.users import get_current_user
from app.services.slack_service import SlackService
from app.services.gemini_service import get_gemini_service

router = APIRouter()
logger = logging.getLogger(__name__)


from app.services.encryption import decrypt_token

async def get_slack_token(user_id: int, db: Session) -> str:
    """Get user's Slack OAuth token"""
    token = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "slack"
    ).first()
    
    if not token:
        raise HTTPException(status_code=400, detail="Slack連携が必要です")
    
    return decrypt_token(token.access_token)


async def sync_slack_tasks_task(user_id: int):
    """Background task for Slack sync"""
    db = SessionLocal()
    try:
        # 1. Get Token
        try:
            access_token = await get_slack_token(user_id, db)
        except HTTPException:
            logger.warning(f"Skipping Slack sync for user {user_id}: No token found")
            return

        # 2. Fetch Messages
        # Fetch last 24 hours of messages filtered by keywords
        messages = await SlackService.fetch_recent_messages(access_token, hours=24)
        
        if not messages:
            logger.info(f"No relevant Slack messages found for user {user_id}")
            return

        # 3. Analyze with Gemini
        gemini = get_gemini_service()
        extracted_tasks = await gemini.extract_tasks_from_slack_messages(messages)
        
        # 4. Save to DB
        imported_count = 0
        for task_data in extracted_tasks:
            # Check for duplicates based on title and source
            # (In a real app, we might want a more robust deduplication strategy using message IDs)
            existing = db.query(Task).filter(
                Task.user_id == user_id,
                Task.title == task_data.get("title"),
                Task.source == "slack"
            ).first()
            
            if not existing:
                new_task = Task(
                    user_id=user_id,
                    title=task_data.get("title", "無題のSlackタスク"),
                    description=task_data.get("description", "") + "\n\nSource: Slack",
                    status="ready",
                    source="slack",
                    estimated_time=task_data.get("estimatedTime", "30分"),
                )
                db.add(new_task)
                imported_count += 1
        
        db.commit()
        logger.info(f"Synced {imported_count} Slack tasks for user {user_id} from {len(messages)} messages")

    except Exception as e:
        logger.error(f"Error syncing Slack: {e}")
        db.rollback()
    finally:
        db.close()


@router.post("/slack/sync")
async def sync_slack_tasks(
    background_tasks: BackgroundTasks,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Trigger Slack sync manually"""
    user = get_current_user(authorization, db)
    
    # Run in background
    background_tasks.add_task(sync_slack_tasks_task, user.id)
    
    return {"message": "Slack sync started in background"}


@router.get("/slack/messages")
async def get_slack_messages(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Debug endpoint to see what messages are fetched"""
    user = get_current_user(authorization, db)
    access_token = await get_slack_token(user.id, db)
    messages = await SlackService.fetch_recent_messages(access_token, hours=24)
    return messages
