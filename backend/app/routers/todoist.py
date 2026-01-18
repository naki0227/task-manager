"""
Todoist Integration Router
Sync Todoist tasks
"""

from fastapi import APIRouter, HTTPException, Depends, Header, BackgroundTasks
from sqlalchemy.orm import Session
import logging
import httpx

from app.database import get_db, SessionLocal
from app.models import User, OAuthToken, Task
from app.routers.users import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_todoist_token(user_id: int, db: Session) -> str:
    """Get user's Todoist OAuth token"""
    token = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "todoist"
    ).first()
    
    if not token:
        raise HTTPException(status_code=400, detail="Todoist連携が必要です")
    
    return token.access_token


async def sync_todoist_tasks_task(user_id: int):
    """Background task for Todoist sync"""
    db = SessionLocal()
    try:
        # 1. Get Token
        try:
            access_token = await get_todoist_token(user_id, db)
        except HTTPException:
            logger.warning(f"Skipping Todoist sync for user {user_id}: No token found")
            return

        # 2. Fetch Tasks (REST API v2)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.todoist.com/rest/v2/tasks",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"filter": "today | overdue"} # Example filter, maybe make configurable? For now sync active stuff. Or just sync all open?
                # Syncing ALL open tasks might be best for "Vision"
            )
            
            if response.status_code != 200:
                logger.error(f"Todoist API Error: {response.text}")
                return
                
            tasks = response.json()
        
        if not tasks:
            logger.info(f"No Todoist tasks found for user {user_id}")
            return

        # 3. Save to DB
        imported_count = 0
        for t in tasks:
            # Check for duplicates (using Todoist ID in title or separate field? We use title/source for now)
            # Better: store external_id if model supported it.
            # Using description signature for unique check
            task_url = t.get("url")
            
            existing = db.query(Task).filter(
                Task.user_id == user_id,
                Task.source == "todoist",
                Task.description.contains(t.get("id")) # Store ID in description to track
            ).first()
            
            description = f"{t.get('description', '')}\n\nTodoist Task ID: {t.get('id')}"
            if task_url:
                description += f"\nURL: {task_url}"
            
            due = t.get("due")
            estimated_time = due.get("string") if due else "30分"
            
            if existing:
                # Update
                existing.title = t.get("content")
                existing.description = description
                existing.status = "done" if t.get("is_completed") else "ready"
                existing.estimated_time = estimated_time
            else:
                # Create
                new_task = Task(
                    user_id=user_id,
                    title=t.get("content"),
                    description=description,
                    status="ready",
                    source="todoist",
                    estimated_time=estimated_time,
                )
                db.add(new_task)
                imported_count += 1
        
        db.commit()
        logger.info(f"Synced {imported_count} Todoist tasks for user {user_id}")

    except Exception as e:
        logger.error(f"Error syncing Todoist: {e}")
        db.rollback()
    finally:
        db.close()


@router.post("/todoist/sync")
async def sync_todoist_tasks(
    background_tasks: BackgroundTasks,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Trigger Todoist sync manually"""
    user = get_current_user(authorization, db)
    background_tasks.add_task(sync_todoist_tasks_task, user.id)
    return {"message": "Todoist sync started in background"}
