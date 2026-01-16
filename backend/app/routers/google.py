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

from app.database import get_db
from app.models import User, OAuthToken, Task
from app.routers.users import get_current_user

router = APIRouter()

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


async def get_google_token(user_id: int, db: Session) -> str:
    """Get user's Google OAuth token"""
    token = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "google"
    ).first()
    
    if not token:
        raise HTTPException(status_code=400, detail="Google連携が必要です")
    
    return token.access_token


@router.get("/google/calendar/events", response_model=List[CalendarEvent])
async def get_calendar_events(
    days: int = 7,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Fetch Google Calendar events for the next N days
    """
    user = get_current_user(authorization, db)
    access_token = await get_google_token(user.id, db)
    
    # Calculate time range
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
            raise HTTPException(status_code=400, detail="カレンダーの取得に失敗しました")
        
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


@router.post("/google/calendar/sync", response_model=SyncResponse)
async def sync_calendar_to_tasks(
    days: int = 7,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Import Google Calendar events as Vision tasks
    """
    user = get_current_user(authorization, db)
    events = await get_calendar_events(days, authorization, db)
    
    imported = 0
    imported_events = []
    
    for event in events:
        # Check if task already exists
        existing = db.query(Task).filter(
            Task.user_id == user.id,
            Task.title == event.title,
            Task.source == "calendar"
        ).first()
        
        if not existing:
            new_task = Task(
                user_id=user.id,
                title=event.title,
                description=event.description or f"予定: {event.start}",
                status="ready",
                source="calendar",
                estimated_time="",
            )
            db.add(new_task)
            imported += 1
            imported_events.append({"title": event.title, "start": event.start})
    
    db.commit()
    
    return SyncResponse(imported=imported, events=imported_events)


@router.get("/google/tasks", response_model=List[GoogleTask])
async def get_google_tasks(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Fetch Google Tasks
    """
    user = get_current_user(authorization, db)
    access_token = await get_google_token(user.id, db)
    
    async with httpx.AsyncClient() as client:
        # First, get task lists
        lists_response = await client.get(
            f"{GOOGLE_TASKS_API}/users/@me/lists",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if lists_response.status_code != 200:
            raise HTTPException(status_code=400, detail="タスクリストの取得に失敗しました")
        
        lists_data = lists_response.json()
        all_tasks = []
        
        for task_list in lists_data.get("items", []):
            # Get tasks from each list
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
        
        return all_tasks


@router.post("/google/tasks/sync", response_model=SyncResponse)
async def sync_google_tasks(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Import Google Tasks as Vision tasks
    """
    user = get_current_user(authorization, db)
    google_tasks = await get_google_tasks(authorization, db)
    
    imported = 0
    imported_tasks = []
    
    for gtask in google_tasks:
        if not gtask.title:
            continue
            
        # Check if task already exists
        existing = db.query(Task).filter(
            Task.user_id == user.id,
            Task.title == gtask.title,
            Task.source == "google_tasks"
        ).first()
        
        if not existing:
            new_task = Task(
                user_id=user.id,
                title=gtask.title,
                description=gtask.notes or "",
                status="ready" if gtask.status == "needsAction" else "completed",
                source="google_tasks",
                estimated_time="",
            )
            db.add(new_task)
            imported += 1
            imported_tasks.append({"title": gtask.title, "due": gtask.due})
    
    db.commit()
    
    return SyncResponse(imported=imported, events=imported_tasks)
