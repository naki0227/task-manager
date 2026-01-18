"""
Tasks Router - Placeholder for team implementation
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel, Field

from app.database import get_db
from app.models import Task, User
from app.routers.users import get_current_user

router = APIRouter()


# --- Schemas ---
class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    prepared_items: List[str] = Field([], alias="preparedItems")
    estimated_time: str = Field(..., alias="estimatedTime")
    source: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True

# --- Endpoints ---

@router.get("/prepared-tasks", response_model=List[TaskResponse])
async def get_tasks(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get all tasks for current user"""
    user = get_current_user(authorization, db)
    # Filter out archived/deleted tasks
    tasks = db.query(Task).filter(
        Task.user_id == user.id,
        Task.status != "archived"
    ).order_by(Task.position.asc(), Task.id.desc()).all()
    
    # Map raw model to response (handling JSON fields if needed)
    response = []
    for t in tasks:
        response.append(TaskResponse(
            id=t.id,
            title=t.title,
            description=t.description or "",
            prepared_items=[],
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


@router.delete("/prepared-tasks/{task_id}")
async def delete_task(
    task_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Delete a task (Soft Delete)"""
    user = get_current_user(authorization, db)
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Soft delete instead of hard delete to prevent re-sync
    task.status = "archived"
    db.commit()
    return {"status": "success"}


class ReorderRequest(BaseModel):
    task_ids: List[int]


@router.put("/prepared-tasks/reorder")
async def reorder_tasks(
    request: ReorderRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Reorder tasks based on the provided list of IDs"""
    user = get_current_user(authorization, db)
    
    # Verify all tasks belong to user
    tasks = db.query(Task).filter(
        Task.user_id == user.id,
        Task.id.in_(request.task_ids)
    ).all()
    
    task_map = {t.id: t for t in tasks}
    
    # Update positions
    for index, task_id in enumerate(request.task_ids):
        if task_id in task_map:
            task_map[task_id].position = index
            
    db.commit()
    return {"status": "success"}
