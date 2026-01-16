"""
Stats Router - Placeholder for team implementation
"""

from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

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


@router.get("/stats/weekly", response_model=WeeklyStatsResponse)
async def get_weekly_stats():
    """Get weekly statistics"""
    # TODO: Calculate from database
    return WeeklyStatsResponse(
        data=[
            DayStats(day="月", tasks=5, hours=3.5),
            DayStats(day="火", tasks=8, hours=5.2),
            DayStats(day="水", tasks=3, hours=2.1),
            DayStats(day="木", tasks=7, hours=4.8),
            DayStats(day="金", tasks=6, hours=4.0),
            DayStats(day="土", tasks=2, hours=1.5),
            DayStats(day="日", tasks=4, hours=2.8),
        ],
        summary=StatsSummary(
            totalTasks=35,
            totalHours=23.9,
            streak=7,
            achievementRate=87,
        ),
    )


@router.get("/stats/monthly", response_model=MonthlyStatsResponse)
async def get_monthly_stats():
    """Get monthly statistics"""
    # TODO: Calculate from database
    return MonthlyStatsResponse(
        data=[
            WeekStats(week="W1", completed=25),
            WeekStats(week="W2", completed=32),
            WeekStats(week="W3", completed=28),
            WeekStats(week="W4", completed=40),
        ],
        skillDistribution=[
            SkillDistribution(name="Frontend", value=45),
            SkillDistribution(name="Backend", value=25),
            SkillDistribution(name="Design", value=15),
            SkillDistribution(name="DevOps", value=15),
        ],
    )


@router.get("/loss-data")
async def get_loss_data():
    """Get opportunity loss data"""
    # TODO: Calculate from last activity
    return {
        "hourlyRate": 3000,
        "idleMinutes": 45,
    }
