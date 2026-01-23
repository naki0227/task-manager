"""
Google Integration Router
Google Calendar and Google Tasks sync
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import httpx

from app.database import get_db, SessionLocal
from app.models import User, OAuthToken, Task
from app.routers.users import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
GOOGLE_TASKS_API = "https://www.googleapis.com/tasks/v1"


class CalendarEvent(BaseModel):
    id: str
    title: str
    start: str
    end: str
    description: Optional[str] = ""


class GoogleTask(BaseModel):
    id: str
    title: str
    notes: Optional[str] = ""
    due: Optional[str] = None
    status: str


class SyncResponse(BaseModel):
    imported: int
    events: List[dict]


from app.services.encryption import decrypt_token

async def get_google_token(user_id: int, db: Session) -> str:
    """Get user's Google OAuth token"""
    token = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "google"
    ).first()
    
    if not token:
        raise HTTPException(status_code=400, detail="Google連携が必要です")
    
    return decrypt_token(token.access_token)


async def fetch_calendar_events(access_token: str, days: int = 7) -> List[CalendarEvent]:
    """Core logic to fetch events"""
    now = datetime.utcnow()
    time_min = now.isoformat() + "Z"
    time_max = (now + timedelta(days=days)).isoformat() + "Z"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": 50,
            }
        )
        
        if response.status_code != 200:
            logger.error(f"Google Calendar API Error: {response.text}")
            return []
        
        data = response.json()
        events = []
        
        for item in data.get("items", []):
            start = item.get("start", {}).get("dateTime") or item.get("start", {}).get("date", "")
            end = item.get("end", {}).get("dateTime") or item.get("end", {}).get("date", "")
            
            events.append(CalendarEvent(
                id=item.get("id", ""),
                title=item.get("summary", "無題のイベント"),
                start=start,
                end=end,
                description=item.get("description", ""),
            ))
        return events


async def import_calendar_events(user_id: int, events: List[CalendarEvent], db: Session) -> int:
    """Core logic to save events as tasks"""
    imported = 0
    # Calendar Import Logic
    for event in events:
        # Match by Title AND Start Time to distinguish recurring events
        existing = db.query(Task).filter(
            Task.user_id == user_id,
            Task.title == event.title,
            Task.source == "calendar",
            Task.estimated_time == str(event.start)
        ).first()
        
        if not existing:
            new_task = Task(
                user_id=user_id,
                title=event.title,
                description=event.description or f"予定: {event.start}",
                status="ready",
                source="calendar",
                estimated_time=str(event.start),
            )
            db.add(new_task)
            imported += 1
        else:
            # Update existing task
            if existing.status != "archived":
                existing.description = event.description or f"予定: {event.start}"
                # existing.estimated_time is already matched
            
    return imported


async def sync_calendar_task(user_id: int):
    """Background task for Calendar sync"""
    db = SessionLocal()
    try:
        try:
            access_token = await get_google_token(user_id, db)
        except HTTPException:
            return

        events = await fetch_calendar_events(access_token)
        imported = await import_calendar_events(user_id, events, db)
        db.commit()
        logger.info(f"Synced {imported} calendar events for user {user_id}")
    except Exception as e:
        logger.error(f"Error syncing Calendar: {e}")
        db.rollback()
    finally:
        db.close()


@router.get("/google/calendar/events", response_model=List[CalendarEvent])
async def get_calendar_events(
    days: int = 7,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    access_token = await get_google_token(user.id, db)
    return await fetch_calendar_events(access_token, days)


@router.post("/google/calendar/sync", response_model=SyncResponse)
async def sync_calendar_to_tasks(
    days: int = 7,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    access_token = await get_google_token(user.id, db)
    events = await fetch_calendar_events(access_token, days)
    imported = await import_calendar_events(user.id, events, db)
    db.commit()
    
    return SyncResponse(imported=imported, events=[{"title": e.title} for e in events])


# --- Google Tasks ---


async def fetch_google_tasks_core(access_token: str) -> List[GoogleTask]:
    async with httpx.AsyncClient() as client:
        lists_response = await client.get(
            f"{GOOGLE_TASKS_API}/users/@me/lists",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if lists_response.status_code != 200:
            logger.error(f"Google Tasks API Error: {lists_response.text}")
            return []
        
        lists_data = lists_response.json()
        all_tasks = []
        
        for task_list in lists_data.get("items", []):
            try:
                tasks_response = await client.get(
                    f"{GOOGLE_TASKS_API}/lists/{task_list['id']}/tasks",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                
                if tasks_response.status_code == 200:
                    tasks_data = tasks_response.json()
                    for item in tasks_data.get("items", []):
                        all_tasks.append(GoogleTask(
                            id=item.get("id", ""),
                            title=item.get("title", ""),
                            notes=item.get("notes", ""),
                            due=item.get("due"),
                            status=item.get("status", "needsAction"),
                        ))
            except Exception as e:
                logger.error(f"Error fetching tasks for list {task_list.get('id')}: {e}")
                continue
                
        return all_tasks


async def import_google_tasks(user_id: int, tasks: List[GoogleTask], db: Session) -> int:
    imported = 0
    for gtask in tasks:
        if not gtask.title:
            continue
            
        existing = db.query(Task).filter(
            Task.user_id == user_id,
            Task.title == gtask.title,
            Task.source == "google_tasks"
        ).first()
        
        if not existing:
            new_task = Task(
                user_id=user_id,
                title=gtask.title,
                description=gtask.notes or "",
                status="ready" if gtask.status == "needsAction" else "completed",
                source="google_tasks",
                estimated_time=str(gtask.due) if gtask.due else "",
            )
            db.add(new_task)
            imported += 1
        else:
            # Update existing task
            if existing.status != "archived":  # Don't resurrect archived tasks
                existing.description = gtask.notes or ""
                # Only update status if mapped status changed (and not archived)
                existing.status = "ready" if gtask.status == "needsAction" else "completed"
                existing.estimated_time = str(gtask.due) if gtask.due else ""
            
    return imported


async def sync_google_tasks_task(user_id: int):
    """Background task for Google Tasks sync"""
    db = SessionLocal()
    try:
        try:
            access_token = await get_google_token(user_id, db)
        except HTTPException:
            return

        tasks = await fetch_google_tasks_core(access_token)
        imported = await import_google_tasks(user_id, tasks, db)
        db.commit()
        logger.info(f"Synced {imported} Google tasks for user {user_id}")
    except Exception as e:
        logger.error(f"Error syncing Google Tasks: {e}")
        db.rollback()
    finally:
        db.close()


@router.get("/google/tasks", response_model=List[GoogleTask])
async def get_google_tasks(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    access_token = await get_google_token(user.id, db)
    return await fetch_google_tasks_core(access_token)


@router.post("/google/tasks/sync", response_model=SyncResponse)
async def sync_google_tasks(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    access_token = await get_google_token(user.id, db)
    tasks = await fetch_google_tasks_core(access_token)
    imported = await import_google_tasks(user.id, tasks, db)
    db.commit()
    
    return SyncResponse(imported=imported, events=[{"title": t.title} for t in tasks])
