"""
Tasks Router - Placeholder for team implementation
"""

from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter()


class PreparedTask(BaseModel):
    id: int
    title: str
    description: str
    preparedItems: List[str]
    estimatedTime: str
    source: str
    status: str


# Mock data - to be replaced with database
MOCK_TASKS = [
    PreparedTask(
        id=1,
        title="Vision Frontend の続き",
        description="昨日の作業の続き。APIクライアントの実装",
        preparedItems=["📁 /lib/api/ フォルダを作成済み", "📄 client.ts のボイラープレートを生成済み"],
        estimatedTime="45分",
        source="github",
        status="ready",
    ),
]


@router.get("/prepared-tasks", response_model=List[PreparedTask])
async def get_prepared_tasks():
    """Get all AI-prepared tasks"""
    # TODO: Fetch from database
    return MOCK_TASKS


@router.post("/prepared-tasks/{task_id}/start")
async def start_task(task_id: int):
    """Start a prepared task"""
    # TODO: Update task status in database
    # TODO: Open related files/folders
    return {"message": f"Task {task_id} started"}


@router.post("/prepared-tasks/{task_id}/complete")
async def complete_task(task_id: int):
    """Complete a task"""
    # TODO: Update task status
    # TODO: Add skill experience
    return {"message": f"Task {task_id} completed"}
