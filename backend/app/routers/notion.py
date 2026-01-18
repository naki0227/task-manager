"""
Notion Integration Router
Sync Notion pages to Tasks
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


async def get_notion_token(user_id: int, db: Session) -> str:
    """Get user's Notion OAuth token"""
    token = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "notion"
    ).first()
    
    if not token:
        raise HTTPException(status_code=400, detail="Notion連携が必要です")
    
    return token.access_token


async def sync_notion_pages_task(user_id: int):
    """Background task for Notion sync"""
    db = SessionLocal()
    try:
        # 1. Get Token
        try:
            access_token = await get_notion_token(user_id, db)
        except HTTPException:
            logger.warning(f"Skipping Notion sync for user {user_id}: No token found")
            return

        # 2. Search Pages (Last edited 20)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.notion.com/v1/search",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Notion-Version": "2022-06-28"
                },
                json={
                    "filter": {"value": "page", "property": "object"},
                    "sort": {"direction": "descending", "timestamp": "last_edited_time"},
                    "page_size": 20
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Notion API Error: {response.text}")
                return
                
            results = response.json().get("results", [])
        
        if not results:
            logger.info(f"No Notion pages found for user {user_id}")
            return

        # 3. Save to DB
        imported_count = 0
        for page in results:
            # Extract Title
            # Notion Title property key varies, usually "Name" or "Title" or "Page".
            # We look for ANY property of type "title".
            properties = page.get("properties", {})
            title_text = "Untitled Notion Page"
            
            for prop_name, prop_val in properties.items():
                if prop_val.get("type") == "title":
                    title_content = prop_val.get("title", [])
                    if title_content:
                        title_text = "".join([t.get("plain_text", "") for t in title_content])
                    break
            
            if title_text == "Untitled Notion Page":
                 # Skip if no title found (often database rows have title, but empty pages might not)
                 continue

            page_url = page.get("url")
            page_id = page.get("id")
            
            # Check for duplicates
            existing = db.query(Task).filter(
                Task.user_id == user_id,
                Task.source == "notion",
                Task.description.contains(page_id)
            ).first()
            
            description = f"Notion Page ID: {page_id}\nURL: {page_url}"
            
            # Determine status? (Hard to genericize)
            # Just set to ready.
            
            if existing:
                existing.title = title_text
                # existing.description = description # Don't overwrite desc if user edited it? 
                # Actually sync should probably update.
                existing.description = description
            else:
                new_task = Task(
                    user_id=user_id,
                    title=title_text,
                    description=description,
                    status="ready",
                    source="notion",
                    estimated_time="Check Notion",
                )
                db.add(new_task)
                imported_count += 1
        
        db.commit()
        logger.info(f"Synced {imported_count} Notion pages for user {user_id}")

    except Exception as e:
        logger.error(f"Error syncing Notion: {e}")
        db.rollback()
    finally:
        db.close()


@router.post("/notion/sync")
async def sync_notion_pages(
    background_tasks: BackgroundTasks,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Trigger Notion sync manually"""
    user = get_current_user(authorization, db)
    background_tasks.add_task(sync_notion_pages_task, user.id)
    return {"message": "Notion sync started in background"}
