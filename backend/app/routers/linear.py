"""
Linear Integration Router
Linear task synchronization
"""

from fastapi import APIRouter, HTTPException, Depends, Header, BackgroundTasks
from sqlalchemy.orm import Session
import logging
from datetime import datetime

from app.database import get_db, SessionLocal
from app.models import User, OAuthToken, Task
from app.routers.users import get_current_user
from app.services.linear_service import LinearService

router = APIRouter()
logger = logging.getLogger(__name__)


from app.services.encryption import decrypt_token

async def get_linear_token(user_id: int, db: Session) -> str:
    """Get user's Linear OAuth token"""
    token = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "linear"
    ).first()
    
    if not token:
        raise HTTPException(status_code=400, detail="Linear連携が必要です")
    
    return decrypt_token(token.access_token)


async def sync_linear_tasks_task(user_id: int):
    """Background task for Linear sync"""
    db = SessionLocal()
    try:
        # 1. Get Token
        try:
            access_token = await get_linear_token(user_id, db)
        except HTTPException:
            logger.warning(f"Skipping Linear sync for user {user_id}: No token found")
            return

        # 2. Fetch Tasks
        issues = await LinearService.fetch_assigned_issues(access_token)
        
        if not issues:
            logger.info(f"No assigned Linear issues found for user {user_id}")
            return

        # 3. Save to DB
        imported_count = 0
        for issue in issues:
            # Check for duplicates
            existing = db.query(Task).filter(
                Task.user_id == user_id,
                Task.source == "linear",
                Task.description.contains(issue.get("url", ""))
            ).first()
            
            # Map priority
            priority_map = {0: "low", 1: "medium", 2: "high", 3: "high", 4: "high"} # 0 = No priority, 1=Urgent?, wait. Linear priority: 0=No Priority, 1=Urgent, 2=High, 3=Medium, 4=Low.
            # Correction: 1=Urgent (High), 2=High, 3=Medium, 4=Low
            p_val = issue.get("priority", 0)
            priority = "medium"
            if p_val == 1 or p_val == 2:
                priority = "high"
            elif p_val == 3:
                priority = "medium"
            elif p_val == 4:
                priority = "low"

            
            # Map Due Date to estimated_time (YYYY-MM-DD or ISO)
            due_date = issue.get("dueDate")
            estimated_time = due_date if due_date else "30分"
            
            description = f"{issue.get('description', '')}\n\nURL: {issue.get('url')}"
            
            if existing:
                # Update existing
                existing.title = f"[{issue.get('identifier')}] {issue.get('title')}"
                existing.description = description
                existing.status = "done" if issue.get("state", {}).get("type") in ["completed", "canceled"] else "ready"
                existing.estimated_time = estimated_time
            else:
                # Create new
                new_task = Task(
                    user_id=user_id,
                    title=f"[{issue.get('identifier')}] {issue.get('title')}",
                    description=description,
                    status="ready",
                    source="linear",
                    estimated_time=estimated_time,
                )
                db.add(new_task)
                imported_count += 1
        
        db.commit()
        logger.info(f"Synced {imported_count} Linear tasks for user {user_id}")

    except Exception as e:
        logger.error(f"Error syncing Linear: {e}")
        db.rollback()
    finally:
        db.close()


@router.post("/linear/sync")
async def sync_linear_tasks(
    background_tasks: BackgroundTasks,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Trigger Linear sync manually"""
    user = get_current_user(authorization, db)
    background_tasks.add_task(sync_linear_tasks_task, user.id)
    return {"message": "Linear sync started in background"}
