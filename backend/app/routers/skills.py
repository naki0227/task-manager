"""
Skills Router - Placeholder for team implementation (AI analysis)
"""

from fastapi import APIRouter
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()


class Skill(BaseModel):
    id: str
    name: str
    level: int
    maxLevel: int
    exp: int
    unlocked: bool


class SkillUpdate(BaseModel):
    skillId: str
    expGain: int
    reason: str


class SkillAnalysisRequest(BaseModel):
    source: str  # "github"
    repoUrl: str
    sinceDays: int = 7


class SkillAnalysisResponse(BaseModel):
    analyzedCommits: int
    skillUpdates: List[SkillUpdate]
    newSkillsDetected: List[str]
    summary: str


# Mock data
MOCK_SKILLS = [
    Skill(id="react", name="React / Next.js", level=2, maxLevel=3, exp=60, unlocked=True),
    Skill(id="typescript", name="TypeScript", level=2, maxLevel=3, exp=45, unlocked=True),
    Skill(id="python", name="Python", level=1, maxLevel=3, exp=30, unlocked=True),
]


@router.get("/skills", response_model=List[Skill])
async def get_skills():
    """Get user skills"""
    # TODO: Fetch from database
    return MOCK_SKILLS


@router.post("/skills/analyze", response_model=SkillAnalysisResponse)
async def analyze_skills(request: SkillAnalysisRequest):
    """
    Analyze GitHub commits and infer skills using Gemini AI
    
    This endpoint should:
    1. Fetch recent commits from GitHub API
    2. Extract code diffs
    3. Send to Gemini for analysis
    4. Return skill updates
    """
    # TODO: Implement with Gemini API
    # See BACKEND_SPEC.md for implementation details
    
    return SkillAnalysisResponse(
        analyzedCommits=0,
        skillUpdates=[],
        newSkillsDetected=[],
        summary="Not implemented yet - requires Gemini integration",
    )


# ========================================
# Dream Analysis
# ========================================

class DreamAnalysisRequest(BaseModel):
    dream: str


class DreamStep(BaseModel):
    id: int
    title: str
    duration: str
    status: str = "pending"


@router.post("/dream/analyze", response_model=List[DreamStep])
async def analyze_dream(request: DreamAnalysisRequest):
    """
    Analyze a dream/goal and break it down into actionable steps
    """
    from app.services.gemini_service import get_gemini_service
    
    service = get_gemini_service()
    steps = await service.analyze_dream(request.dream)
    
    # Ensure proper format
    return [
        DreamStep(
            id=step.get("id", i + 1),
            title=step.get("title", "ステップ"),
            duration=step.get("duration", "未定"),
            status=step.get("status", "pending")
        )
        for i, step in enumerate(steps)
    ]
