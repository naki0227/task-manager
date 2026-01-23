"""
GitHub Integration Router
Sync GitHub Issues to Tasks
"""

from fastapi import APIRouter, HTTPException, Depends, Header, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import httpx
import logging

from app.database import get_db, SessionLocal
from app.models import User, OAuthToken, Task
from app.routers.users import get_current_user

router = APIRouter()

logger = logging.getLogger(__name__)

GITHUB_API_URL = "https://api.github.com"


class GitHubIssue(BaseModel):
    id: int
    title: str
    html_url: str
    state: str
    number: int
    repository_name: str


class SyncResponse(BaseModel):
    imported: int
    events: List[dict]


from app.services.encryption import decrypt_token

async def get_github_token(user_id: int, db: Session) -> str:
    """Get user's GitHub OAuth token"""
    token = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "github"
    ).first()
    
    if not token:
        raise HTTPException(status_code=400, detail="GitHub連携が必要です")
    
    return decrypt_token(token.access_token)


async def fetch_github_issues(access_token: str) -> List[dict]:
    """Fetch assigned issues from GitHub"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GITHUB_API_URL}/issues",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json"
            },
            params={
                "filter": "assigned",
                "state": "open",
                "per_page": 50
            }
        )
        
        if response.status_code != 200:
            logger.error(f"GitHub API Error: {response.text}")
            return []
            
        return response.json()


async def sync_github_issues_task(user_id: int):
    print(f"DEBUG: Starting GitHub sync for user {user_id}")
    db = SessionLocal()
    try:
        # Get token
        try:
            access_token = await get_github_token(user_id, db)
            print(f"DEBUG: Found GitHub token for user {user_id}")
        except HTTPException:
            logger.warning(f"User {user_id} has no GitHub token, skipping sync")
            print(f"DEBUG: No GitHub token for user {user_id}")
            return

        # Fetch issues
        print("DEBUG: Fetching issues from GitHub...")
        issues = await fetch_github_issues(access_token)
        print(f"DEBUG: Fetched {len(issues)} issues")
        
        imported = 0
        for issue in issues:
            # Skip if pull request (optional, but usually treated differently)
            # if "pull_request" in issue:
            #     continue

            repo_name = issue.get("repository", {}).get("name", "unknown")
            if not repo_name and "repository_url" in issue:
                repo_name = issue["repository_url"].split("/")[-1]

            title = f"[{repo_name}] #{issue['number']} {issue['title']}"
            
            # Check for duplicates
            existing = db.query(Task).filter(
                Task.user_id == user_id,
                Task.source == "github",
                Task.description.contains(issue['html_url'])
            ).first()
            
            if not existing:
                new_task = Task(
                    user_id=user_id,
                    title=title,
                    description=f"{issue['body'] or ''}\n\nSource: {issue['html_url']}",
                    status="ready",
                    source="github",
                    estimated_time=""
                )
                db.add(new_task)
                imported += 1
        
        db.commit()
        logger.info(f"Synced {imported} GitHub issues for user {user_id}")
        return imported
        
    except Exception as e:
        logger.error(f"Error syncing GitHub issues: {e}")
        db.rollback()
    finally:
        db.close()


@router.post("/github/sync", response_model=SyncResponse)
@router.post("/github/sync", response_model=SyncResponse)
async def trigger_github_sync(
    background_tasks: BackgroundTasks,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Trigger manual GitHub sync
    """
    user = get_current_user(authorization, db)
    
    # Run sync in background
    background_tasks.add_task(sync_github_issues_task, user.id)
    
    return SyncResponse(imported=0, events=[{"message": "Sync started in background"}])
