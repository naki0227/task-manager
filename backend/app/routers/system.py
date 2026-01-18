from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import os

from app.config import get_settings

router = APIRouter()

class LaunchRequest(BaseModel):
    action_id: str

@router.get("/config")
async def get_system_config():
    import sys
    # Treat non-macOS as "cloud" (feature limited) environment for UI purposes
    return {"is_cloud_env": sys.platform != "darwin"}

@router.post("/launch")
async def launch_action(request: LaunchRequest):
    """
    Launch local applications or URLs based on action ID
    """
    import sys
    if sys.platform != "darwin":
        raise HTTPException(status_code=403, detail="Not supported on this platform (macOS only)")
        
    action = request.action_id
    
    try:
        if action == "dev_env":
            # Open VS Code in current project directory
            cwd = os.getcwd()
            # Assuming cwd is backend/, move up to root
            project_root = os.path.dirname(os.path.dirname(cwd)) 
            # Adjust path logic depending on where uvicorn is run.
            # User is running uvicorn in backend/
            # So os.getcwd() -> .../task-management/backend
            # Project root -> .../task-management
            
            # Actually simpler: just open the repo path
            repo_path = "/Users/hw24a094/task-management"
            # Use open -a for VS Code to avoid PATH issues
            subprocess.Popen(["open", "-a", "Visual Studio Code", repo_path])
            subprocess.Popen(["open", "-a", "Terminal", repo_path])
            return {"status": "launched", "message": "Development environment started"}
            
        elif action == "review":
            # Open GitHub PR page
            subprocess.Popen(["open", "https://github.com/naki0227/task-manager/pulls"])
            return {"status": "launched", "message": "GitHub PR page opened"}
            
        elif action == "learning":
            # Open Docs and Notes
            subprocess.Popen(["open", "https://docs.python.org/3/"])
            subprocess.Popen(["open", "-a", "Notes"]) # macOS Notes app
            return {"status": "launched", "message": "Learning session started"}
            
        elif action == "meeting":
            # Open Zoom
            subprocess.Popen(["open", "-a", "zoom.us"])
            return {"status": "launched", "message": "Zoom opened"}
            
        else:
            raise HTTPException(status_code=400, detail="Unknown action")
            
    except Exception as e:
        print(f"Launch Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to launch: {str(e)}")
