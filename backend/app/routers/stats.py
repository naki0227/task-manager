from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import pytz

from app.database import get_db
from app.models import Task, FocusSession
from app.routers.users import get_current_user

router = APIRouter()

class DayStats(BaseModel):
    day: str
    tasks: int
    hours: float

class WeekStats(BaseModel):
    week: str
    completed: int

class SkillDistribution(BaseModel):
    name: str
    value: int

class StatsSummary(BaseModel):
    totalTasks: int
    totalHours: float
    streak: int
    achievementRate: int

class WeeklyStatsResponse(BaseModel):
    data: List[DayStats]
    summary: StatsSummary

class MonthlyStatsResponse(BaseModel):
    data: List[WeekStats]
    skillDistribution: List[SkillDistribution]

class FocusSessionRequest(BaseModel):
    durationMinutes: int

@router.post("/stats/focus")
async def record_focus_session(
    request: FocusSessionRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Record a completed focus session"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    user = get_current_user(authorization, db)
    
    new_session = FocusSession(
        user_id=user.id,
        duration_minutes=request.durationMinutes,
        completed_at=datetime.utcnow()
    )
    
    db.add(new_session)
    db.commit()
    return {"status": "success"}

@router.get("/stats/weekly", response_model=WeeklyStatsResponse)
async def get_weekly_stats(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get weekly statistics from real data"""
    if not authorization:
        # Return empty/mock if no auth (or raise error)
        # For demo purposes, we might want to return mock if not logged in, 
        # but better to enforce auth for real stats.
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = get_current_user(authorization, db)
    
    # Calculate range (Last 7 days)
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    
    # Prepare data structure for 7 days
    stats_map = {}
    for i in range(7):
        date = start_date + timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        # Japanese day name
        day_name = ["月", "火", "水", "木", "金", "土", "日"][date.weekday()]
        stats_map[date_str] = {"day": day_name, "tasks": 0, "minutes": 0}

    # Query 1: Completed Tasks in range
    # Note: Task model doesn't have completed_at, so we use updated_at for completed tasks
    tasks = db.query(Task).filter(
        Task.user_id == user.id,
        Task.status == "completed",
        Task.updated_at >= start_date
    ).all()
    
    for task in tasks:
        # Ensure updated_at is date object
        d = task.updated_at.date()
        d_str = d.strftime("%Y-%m-%d")
        if d_str in stats_map:
            stats_map[d_str]["tasks"] += 1

    # Query 2: Focus Sessions in range
    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == user.id,
        FocusSession.completed_at >= start_date
    ).all()
    
    for sess in sessions:
        d = sess.completed_at.date()
        d_str = d.strftime("%Y-%m-%d")
        if d_str in stats_map:
            stats_map[d_str]["minutes"] += sess.duration_minutes

    # Convert to list
    data = []
    total_tasks = 0
    total_minutes = 0
    
    sorted_dates = sorted(stats_map.keys())
    for date_str in sorted_dates:
        item = stats_map[date_str]
        hours = round(item["minutes"] / 60, 1)
        data.append(DayStats(
            day=item["day"],
            tasks=item["tasks"],
            hours=hours
        ))
        total_tasks += item["tasks"]
        total_minutes += item["minutes"]

    # Calculate Summary
    total_hours = round(total_minutes / 60, 1)
    
    # Streak Calculation (Simplified: check continuous days with activity)
    # This logic checks backwards from yesterday/today
    streak = 0
    check_date = today
    # Iterate backwards max 365 days
    has_today_activity = stats_map[today.strftime("%Y-%m-%d")]["tasks"] > 0 or stats_map[today.strftime("%Y-%m-%d")]["minutes"] > 0
    if has_today_activity:
        streak = 1
        check_date = today - timedelta(days=1)
    
    # Need to query further back for real streak, but for now we limit to strictly observed range?
    # Or just query DB for activities ordered by date desc
    # For MVP, let's just query completed tasks/sessions distinct dates
    
    # Better Streak Logic:
    # Get all activity dates (tasks or sessions) in descending order
    # (Simplified for now, just 0 unless accurate logic implemented)
    
    return WeeklyStatsResponse(
        data=data,
        summary=StatsSummary(
            totalTasks=total_tasks,
            totalHours=total_hours,
            streak=streak, # Placeholder or simple logic
            achievementRate=85, # Placeholder, achievement rate needs Goals feature
        ),
    )

@router.get("/stats/monthly", response_model=MonthlyStatsResponse)
async def get_monthly_stats(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get monthly statistics (Real data)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = get_current_user(authorization, db)
    
    # 1. Monthly Tasks (Last 4 weeks)
    today = datetime.utcnow().date()
    # Align to Monday? Or just simple 28 days back? Simple is better.
    start_date = today - timedelta(days=27) 
    
    data = []
    
    # Pre-fetch tasks to minimize queries
    tasks = db.query(Task).filter(
        Task.user_id == user.id,
        Task.status == 'completed',
        Task.updated_at >= start_date # Approximate
    ).all()
    
    # Group by week
    for i in range(4):
        # W1: start -> start+6
        # W2: start+7 -> start+13 ...
        w_start = start_date + timedelta(days=i*7)
        w_end = w_start + timedelta(days=7) # exclusive for next iteration logic, but strictly inclusive for date checks
        
        # Count tasks in this week window
        count = 0
        for t in tasks:
            t_date = t.updated_at.date()
            if w_start <= t_date < w_end:
                 count += 1
        
        data.append(WeekStats(week=f"W{i+1}", completed=count))

    # 2. Skill Distribution (From User Skills)
    # We use the user's skill levels/exp to show "What skills do you have?"
    # Ideally this would be "Skills used this month", but we don't track that yet.
    # So we show "Current Skill Portfolio".
    from app.models import Skill
    skills = db.query(Skill).filter(Skill.user_id == user.id).all()
    
    skill_dist = []
    if skills:
        # Sort by level/exp and take top ones? Or all?
        # Let's take top 5 by level * 100 + exp
        sorted_skills = sorted(skills, key=lambda s: s.level * 100 + s.exp, reverse=True)
        
        total_val = sum(s.level * 100 + s.exp for s in sorted_skills) or 1
        
        for s in sorted_skills[:5]: # Top 5
            val = s.level * 100 + s.exp
            # Normalize to some percentage or just use raw?
            # The frontend charts usually handle raw values.
            skill_dist.append(SkillDistribution(name=s.name, value=val))
    
    if not skill_dist:
        # Placeholder if no skills
        skill_dist = [SkillDistribution(name="No Skills Yet", value=1)]

    return MonthlyStatsResponse(
        data=data,
        skillDistribution=skill_dist
    )


@router.get("/stats/summary")
async def get_stats_summary(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get stats summary for the dashboard"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = get_current_user(authorization, db)
    
    # Calculate range (Last 7 days)
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    
    # Query 1: Completed Tasks in range
    tasks_count = db.query(Task).filter(
        Task.user_id == user.id,
        Task.status == "completed",
        Task.updated_at >= start_date
    ).count()

    # Query 2: Focus Sessions in range
    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == user.id,
        FocusSession.completed_at >= start_date
    ).all()
    
    total_minutes = sum(s.duration_minutes for s in sessions)
    total_hours = round(total_minutes / 60, 1)

    # Streak Calculation
    # Get active dates in last 30 days
    streak_start_date = today - timedelta(days=30)
    
    # Get task dates
    task_dates = db.query(func.date(Task.updated_at)).filter(
        Task.user_id == user.id,
        Task.status == "completed",
        Task.updated_at >= streak_start_date
    ).all()
    
    # Get session dates
    session_dates = db.query(func.date(FocusSession.completed_at)).filter(
        FocusSession.user_id == user.id,
        FocusSession.completed_at >= streak_start_date
    ).all()
    
    # Set of YYYY-MM-DD strings
    active_dates = set()
    for d in task_dates:
        active_dates.add(str(d[0]))
    for d in session_dates:
        active_dates.add(str(d[0]))
        
    # Calculate streak
    streak = 0
    # Check from today backwards
    check_date = today
    
    # Allow current streak to continue if today is not done but yesterday was
    # If today has activity info, start checking from today.
    # If today has NO activity, start checking from yesterday (to preserve streak)
    today_str = extract_date_str(today)
    yesterday_str = extract_date_str(today - timedelta(days=1))
    
    if today_str in active_dates:
        check_date = today
    elif yesterday_str in active_dates:
        check_date = today - timedelta(days=1)
    else:
        # No activity today or yesterday -> streak broken
        check_date = None
        
    if check_date:
        for i in range(365):
            d_str = extract_date_str(check_date - timedelta(days=i))
            if d_str in active_dates:
                streak += 1
            else:
                break

    return [
        {"label": "今週の完了タスク", "value": str(tasks_count), "change": "-"},
        {"label": "集中時間", "value": f"{total_hours}h", "change": "-"},
        {"label": "連続日数", "value": f"{streak}日", "change": "継続中"},
        {"label": "達成率", "value": "85%", "change": "-"},
    ]


def extract_date_str(d):
    """Helper to handle date/datetime objects safely"""
    if isinstance(d, datetime):
        return d.strftime("%Y-%m-%d")
    return str(d)
