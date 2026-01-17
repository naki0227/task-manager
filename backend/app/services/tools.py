"""
This module defines the tools (functions) available to the Gemini AI.
These tools are passed to the Gemini API for Function Calling.
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Task, User
from sqlalchemy.orm import Session
# Note: For DB access in tools, we might need a way to get a session or pass it.
# For simplicity in this iteration, we'll instantiate a session or require it passed.

def get_current_date():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# --- Tool Definitions (Schema) ---

AVAILABLE_TOOLS = [
    {
        "function_declarations": [
            {
                "name": "add_task",
                "description": "Add a new task to the user's task list.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "Title of the task (concise)"
                        },
                        "description": {
                            "type": "string",
                            "description": "Detailed description of the task"
                        },
                        "estimated_time": {
                            "type": "string",
                            "description": "Estimated time to complete (e.g., '30分', '1時間')"
                        },
                        "priority": {
                            "type": "string",
                            "description": "Priority level ('high', 'medium', 'low')",
                            "enum": ["high", "medium", "low"]
                        }
                    },
                    "required": ["title"]
                }
            },
            {
                "name": "get_calendar_events",
                "description": "Get user's calendar events for the specified number of days.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "days": {
                            "type": "integer",
                            "description": "Number of days to fetch (default: 1)"
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "get_current_time",
                "description": "Get current date and time.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            },
            {
                "name": "launch_app",
                "description": "Launch a local application or tool (Quick Launch).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "action_id": {
                            "type": "string",
                            "description": "ID of the action to launch ('dev_env', 'review', 'learning', 'meeting')",
                            "enum": ["dev_env", "review", "learning", "meeting"]
                        }
                    },
                    "required": ["action_id"]
                }
            }
        ]
    }
]

# --- Tool Implementations ---

async def add_task(title: str, description: str = "", estimated_time: str = "30分", priority: str = "medium", user_id: int = None, db: Session = None):
    """Add a task to the DB"""
    if not db or not user_id:
        return {"status": "error", "message": "Database connection or User ID missing"}
    
    new_task = Task(
        title=title,
        description=description,
        estimated_time=estimated_time,
        status="ready", # Tasks from chat start as ready? or pending?
        user_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        source="chat" # Indicate source
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return {"status": "success", "task_id": new_task.id, "message": f"Task '{title}' added."}

async def get_calendar_events(days: int = 1, user_id: int = None, db: Session = None):
    """Mock calendar events"""
    # In future, fetch from Google Calendar API using stored tokens
    # user = db.query(User).filter(User.id == user_id).first()
    
    today = datetime.now()
    events = []
    
    # Mock data
    events.append({
        "summary": "Team Meeting",
        "start": (today + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M"),
        "end": (today + timedelta(hours=3)).strftime("%Y-%m-%d %H:%M")
    })
    
    if days > 1:
        events.append({
            "summary": "Project Deadline",
            "start": (today + timedelta(days=1, hours=10)).strftime("%Y-%m-%d %H:%M"),
            "end": (today + timedelta(days=1, hours=12)).strftime("%Y-%m-%d %H:%M")
        })

    return {"events": events}

async def get_current_time():
    return {"time": get_current_date()}

async def launch_app(action_id: str):
    """Launch local app"""
    import subprocess
    import os
    
    try:
        if action_id == "dev_env":
            repo_path = "/Users/hw24a094/task-management"
            subprocess.Popen(["open", "-a", "Visual Studio Code", repo_path])
            subprocess.Popen(["open", "-a", "Terminal", repo_path])
            return {"status": "success", "message": "Development environment (VS Code + Terminal) launched."}
            
        elif action_id == "review":
            subprocess.Popen(["open", "https://github.com/naki0227/task-manager/pulls"])
            return {"status": "success", "message": "GitHub Pull Requests opened."}
            
        elif action_id == "learning":
            subprocess.Popen(["open", "https://docs.python.org/3/"])
            subprocess.Popen(["open", "-a", "Notes"])
            return {"status": "success", "message": "Learning resources opened."}
            
        elif action_id == "meeting":
            subprocess.Popen(["open", "-a", "zoom.us"])
            return {"status": "success", "message": "Zoom launched."}
            
        return {"status": "error", "message": "Unknown action_id"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Mapping
TOOL_FUNCTIONS = {
    "add_task": add_task,
    "get_calendar_events": get_calendar_events,
    "get_current_time": get_current_time,
    "launch_app": launch_app
}
