"""
Tasks Router - Placeholder for team implementation
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()


# --- Schemas ---
class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    prepared_items: List[str] = []
    estimated_time: str
    source: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/prepared-tasks", response_model=List[TaskResponse])
async def get_tasks(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get all tasks for current user"""
    user = get_current_user(authorization, db)
    tasks = db.query(Task).filter(Task.user_id == user.id).all()
    
    # Map raw model to response (handling JSON fields if needed)
    response = []
    for t in tasks:
        response.append(TaskResponse(
            id=t.id,
            title=t.title,
            description=t.description or "",
            prepared_items=[], # TODO: Store as JSON string in DB if needed
            estimated_time=t.estimated_time or "30分",
            source=t.source or "manual",
            status=t.status,
            created_at=t.created_at
        ))
    return response


@router.post("/prepared-tasks/{task_id}/start")
async def start_task(
    task_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Mark task as in-progress"""
    user = get_current_user(authorization, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = "in-progress"
    db.commit()
    return {"status": "success", "task_id": task.id}


@router.post("/prepared-tasks/{task_id}/complete")
async def complete_task(
    task_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Mark task as completed"""
    user = get_current_user(authorization, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = "completed"
    db.commit()
    
    # TODO: Calculate Exp gain here
    
    return {"status": "success", "task_id": task.id}
