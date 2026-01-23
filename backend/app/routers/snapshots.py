from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import subprocess
import os

from app.database import get_db
from app.models import Snapshot, User
from app.routers.users import get_current_user
from app.config import get_settings

router = APIRouter()

class SnapshotCreate(BaseModel):
    name: str
    notes: Optional[str] = ""
    windows: Optional[List[dict]] = None # Allow external input (e.g. from Chrome Extension)

class SnapshotResponse(BaseModel):
    id: int
    name: str
    windows: List[dict] # Simply storing list of objects for now
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True

def get_chrome_tabs():
    """Get list of open tabs from Google Chrome via AppleScript"""
    script_simple = '''
    tell application "Google Chrome"
        set urlList to ""
        repeat with w in windows
            repeat with t in tabs of w
                set urlList to urlList & (URL of t) & "\\n"
            end repeat
        end repeat
        return urlList
    end tell
    '''
    
    try:
        import sys
        if sys.platform != "darwin":
            return []

        result = subprocess.run(['osascript', '-e', script_simple], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"AppleScript Error: {result.stderr}")
            return []
        
        urls = result.stdout.strip().split('\n')
        urls = [u for u in urls if u.strip()]
        
        windows = []
        if urls:
            windows.append({
                "type": "browser",
                "name": "Google Chrome (AppleScript)",
                "urls": urls
            })
            
        return windows
    except Exception as e:
        print(f"Capture Error: {e}")
        return []

@router.post("/snapshots", response_model=SnapshotResponse)
async def create_snapshot(
    request: SnapshotCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Capture current context (Chrome tabs) and save as snapshot"""
    user = get_current_user(authorization, db)
    
    # Capture Context
    # If windows provided in request (from Extension), use it. Otherwise capture locally.
    if request.windows:
        windows_data = request.windows
    else:
        windows_data = get_chrome_tabs()
    
    # Add VS Code (current project) as default if running locally
    # We can assume the current project where the server is running
    repo_path = "/Users/hw24a094/task-management"
    
    # Avoid duplicate VS Code entries if already provided (though unlikely from Chrome Ext)
    has_vscode = any(w.get("type") == "code" for w in windows_data)
    
    if not has_vscode:
        windows_data.append({
            "type": "code",
            "name": "Visual Studio Code",
            "path": repo_path
        })
    
    snapshot = Snapshot(
        user_id=user.id,
        name=request.name,
        notes=request.notes,
        windows=json.dumps(windows_data),
        created_at=datetime.utcnow()
    )
    
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    
    # Parse json for response
    snapshot.windows = json.loads(snapshot.windows)
    return snapshot

@router.get("/snapshots", response_model=List[SnapshotResponse])
async def get_snapshots(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get all snapshots for user"""
    user = get_current_user(authorization, db)
    snapshots = db.query(Snapshot).filter(Snapshot.user_id == user.id).order_by(Snapshot.created_at.desc()).all()
    
    # Parse JSON
    result = []
    for s in snapshots:
        s_dict = s.__dict__
        if isinstance(s_dict['windows'], str):
            s_dict['windows'] = json.loads(s_dict['windows'])
        result.append(s_dict)
        
    return result

@router.post("/snapshots/{snapshot_id}/resume")
async def resume_snapshot(
    snapshot_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Resume a snapshot (Open URLs and Apps)"""
    import sys
    if sys.platform != "darwin":
        raise HTTPException(status_code=403, detail="Snapshot resume is only supported on macOS")

    user = get_current_user(authorization, db)
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id, Snapshot.user_id == user.id).first()
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
        
    data = json.loads(snapshot.windows)
    
    resumed_count = 0
    for item in data:
        if item.get("type") == "browser":
            urls = item.get("urls", [])
            for url in urls:
                subprocess.Popen(["open", url])
                resumed_count += 1
        
        elif item.get("type") == "code":
            path = item.get("path")
            if path:
                subprocess.Popen(["open", "-a", "Visual Studio Code", path])
                resumed_count += 1
                
    return {"message": f"Resumed {resumed_count} items"}

@router.delete("/snapshots/{snapshot_id}")
async def delete_snapshot(
    snapshot_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(authorization, db)
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id, Snapshot.user_id == user.id).first()
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
        
    db.delete(snapshot)
    db.commit()
    return {"message": "Deleted"}
