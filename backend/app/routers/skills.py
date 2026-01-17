"""
Skills Router - AI skill analysis from GitHub commits
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import httpx
import logging
import base64
import json
import asyncio
import re

from app.database import get_db, SessionLocal
from app.models import OAuthToken, Skill as SkillModel
from app.routers.users import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

GITHUB_API_URL = "https://api.github.com"

async def _analyze_dependency_files(client, repo_full_name, access_token):
    """Analyze dependency files in a repo to detect frameworks"""
    dependencies = set()
    
    # Files to check
    FILES_TO_CHECK = {
        "package.json": "javascript",
        "requirements.txt": "python",
        "pyproject.toml": "python",
        "go.mod": "go",
        "Cargo.toml": "rust",
        "pubspec.yaml": "dart",
        "composer.json": "php",
        "Gemfile": "ruby"
    }
    
    try:
        # Fetch root directory content efficiently
        response = await client.get(
            f"{GITHUB_API_URL}/repos/{repo_full_name}/contents",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json"
            }
        )
        
        if response.status_code != 200:
            return []
            
        files = response.json()
        if not isinstance(files, list):
            return []
            
        found_files = [f for f in files if f["name"] in FILES_TO_CHECK]
        
        # Analyze each found file
        for file_info in found_files:
            file_name = file_info["name"]
            
            # Fetch file content
            content_response = await client.get(
                file_info["url"],
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            if content_response.status_code != 200:
                continue
                
            content_data = content_response.json()
            if "content" not in content_data:
                continue
                
            # Decode content
            try:
                content = base64.b64decode(content_data["content"]).decode("utf-8")
                
                # Extract dependencies based on file type
                if file_name == "package.json":
                    try:
                        pkg = json.loads(content)
                        deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                        dependencies.update(deps.keys())
                    except:
                        pass
                
                elif file_name == "requirements.txt":
                    # Simple regex for requirements.txt
                    matches = re.findall(r"^([a-zA-Z0-9_\-]+)", content, re.MULTILINE)
                    dependencies.update([m.lower() for m in matches])
                
                elif file_name == "pyproject.toml":
                    # Simple regex for pyproject.toml dependencies (poetry/flit)
                    matches = re.findall(r"([a-zA-Z0-9_\-]+)\s*=", content)
                    dependencies.update([m.lower() for m in matches if m not in ["python", "version", "name", "authors"]])
                
                elif file_name == "go.mod":
                    matches = re.findall(r"([a-zA-Z0-9_\-\./]+)\s+v", content)
                    dependencies.update([m.split("/")[-1] for m in matches])
                
                elif file_name == "Cargo.toml":
                    matches = re.findall(r"^([a-zA-Z0-9_\-]+)\s*=", content, re.MULTILINE)
                    dependencies.update([m for m in matches if m not in ["name", "version", "edition"]])
                
                elif file_name == "pubspec.yaml":
                    # Extract dependencies under dependencies:
                    in_deps = False
                    for line in content.splitlines():
                        if line.strip().startswith("dependencies:"):
                            in_deps = True
                            continue
                        if in_deps and line.strip() and not line.startswith(" ") and ":" in line:
                            in_deps = False
                        if in_deps and ":" in line:
                            dep = line.split(":")[0].strip()
                            dependencies.add(dep)

            except Exception as e:
                logger.error(f"Error parsing {file_name} in {repo_full_name}: {e}")
                
    except Exception as e:
        logger.error(f"Error checking dependencies for {repo_full_name}: {e}")
        
    # Return top relevant dependencies (filtering common/noise)
    relevant = [d for d in dependencies if len(d) > 2 and not d.startswith("@types/")]
    return list(relevant)[:50]


class Skill(BaseModel):
    id: str
    name: str
    level: int
    maxLevel: int
    exp: int
    unlocked: bool


class SkillUpdate(BaseModel):
    skillId: str
    skillName: Optional[str] = None
    expGain: int
    reason: str


class SkillAnalysisRequest(BaseModel):
    sinceDays: int = 7


class SkillAnalysisResponse(BaseModel):
    analyzedCommits: int
    skillUpdates: List[SkillUpdate]
    newSkillsDetected: List[str]
    summary: str


class InitialScanResponse(BaseModel):
    analyzedRepos: int
    skills: List[Skill]
    summary: str


async def get_github_token_by_user_id(user_id: int, db: Session) -> Optional[str]:
    """Get user's GitHub OAuth token"""
    token = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "github"
    ).first()
    
    return token.access_token if token else None


async def fetch_all_repos_languages(access_token: str) -> List[dict]:
    """Fetch all user's repos with their languages"""
    repos_data = []
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Get all user's repos (up to 100)
        repos_response = await client.get(
            f"{GITHUB_API_URL}/user/repos",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json"
            },
            params={
                "sort": "pushed",
                "per_page": 100,
                "affiliation": "owner,collaborator"
            }
        )
        
        if repos_response.status_code != 200:
            logger.error(f"GitHub repos API error: {repos_response.text}")
            return []
        
        repos = repos_response.json()
        
        # Get languages for each repo
        tasks = []
        for repo in repos[:20]:  # Limit to 20 repos for detailed analysis
            repo_info = {
                "name": repo.get("name", ""),
                "full_name": repo.get("full_name", ""),
                "description": repo.get("description", ""),
                "language": repo.get("language", ""),
                "topics": repo.get("topics", []),
                "languages": {},
                "dependencies": []
            }
            repos_data.append(repo_info)
            
            # Tasks for parallel execution
            tasks.append(client.get(
                f"{GITHUB_API_URL}/repos/{repo.get('full_name', '')}/languages",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            ))
            
            # Add dependency check task
            tasks.append(_analyze_dependency_files(client, repo.get("full_name", ""), access_token))
            
        # Execute all tasks in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for i, repo_info in enumerate(repos_data):
            # Language result (even index)
            lang_result = results[i*2]
            if not isinstance(lang_result, Exception) and lang_result.status_code == 200:
                repo_info["languages"] = lang_result.json()
            
            # Dependency result (odd index)
            dep_result = results[i*2+1]
            if not isinstance(dep_result, Exception) and isinstance(dep_result, list):
                repo_info["dependencies"] = dep_result

    return repos_data
    
    return repos_data


async def initial_skill_scan_task(user_id: int):
    """Background task to scan all repos and set initial skills"""
    logger.info(f"Starting initial skill scan for user {user_id}")
    db = SessionLocal()
    
    try:
        # Get GitHub token
        access_token = await get_github_token_by_user_id(user_id, db)
        if not access_token:
            logger.error(f"No GitHub token for user {user_id}")
            return
        
        # Fetch all repos with languages
        repos = await fetch_all_repos_languages(access_token)
        
        if not repos:
            logger.info(f"No repos found for user {user_id}")
            return
        
        # Prepare data for Gemini analysis
        from app.services.gemini_service import get_gemini_service
        service = get_gemini_service()
        
        # Format repos for analysis
        repos_text = "\n".join([
            f"- {r['name']}: {r['language']} ({', '.join(r.get('topics', [])[:3])})\n  Desc: {r.get('description', '')}\n  Dependencies: {', '.join(r.get('dependencies', []))}\n  Languages: {', '.join(r.get('languages', {}).keys())}"
            for r in repos[:20]
        ])
        
        # Comprehensive skill definitions
        KNOWN_SKILLS = """
【検出可能なスキル一覧】

■ 言語 (Languages)
- python: Python
- typescript: TypeScript
- javascript: JavaScript
- go: Go
- rust: Rust
- swift: Swift
- dart: Dart
- java: Java
- kotlin: Kotlin
- c++: C++
- c: C
- csharp: C#
- ruby: Ruby
- php: PHP
- scala: Scala
- html: HTML
- css: CSS
- sql: SQL
- shell: Shell/Bash

■ フロントエンド (Frontend Frameworks)
- react: React
- nextjs: Next.js
- vue: Vue.js
- nuxt: Nuxt.js
- angular: Angular
- svelte: Svelte
- solidjs: SolidJS
- astro: Astro
- remix: Remix
- gatsby: Gatsby

■ バックエンド (Backend Frameworks)
- fastapi: FastAPI
- django: Django
- flask: Flask
- express: Express.js
- nestjs: NestJS
- rails: Ruby on Rails
- laravel: Laravel
- spring: Spring Boot
- gin: Gin (Go)
- echo: Echo (Go)
- actix: Actix (Rust)
- axum: Axum (Rust)

■ モバイル (Mobile)
- flutter: Flutter
- reactnative: React Native
- swiftui: SwiftUI
- jetpackcompose: Jetpack Compose

■ CSS/スタイリング
- tailwindcss: Tailwind CSS
- sass: Sass/SCSS
- styledcomponents: styled-components
- emotion: Emotion
- chakraui: Chakra UI
- materialui: Material UI

■ データベース (Database)
- postgresql: PostgreSQL
- mysql: MySQL
- mongodb: MongoDB
- redis: Redis
- sqlite: SQLite
- prisma: Prisma
- supabase: Supabase
- firebase: Firebase

■ DevOps/Infrastructure
- docker: Docker
- kubernetes: Kubernetes
- terraform: Terraform
- aws: AWS
- gcp: Google Cloud
- azure: Azure
- vercel: Vercel
- cloudflare: Cloudflare

■ テスト/品質
- jest: Jest
- vitest: Vitest
- pytest: pytest
- playwright: Playwright
- cypress: Cypress

■ その他
- graphql: GraphQL
- trpc: tRPC
- openai: OpenAI API
- langchain: LangChain
- threejs: Three.js
- unity: Unity
- unreal: Unreal Engine
"""
        
        # Use Gemini to analyze skills
        result = await service._generate_json(f"""
以下のGitHubリポジトリ一覧を分析し、ユーザーのプログラミングスキルを推測してください。

リポジトリ一覧:
{repos_text}

{KNOWN_SKILLS}

上記のスキル一覧から、リポジトリで使用されているスキルを検出してください。

以下のJSON形式で返してください:
{{
  "skills": [
    {{"id": "python", "name": "Python", "level": 2, "maxLevel": 3, "exp": 60, "reason": "複数のPythonプロジェクトで使用"}},
    {{"id": "fastapi", "name": "FastAPI", "level": 2, "maxLevel": 3, "exp": 50, "reason": "バックエンドAPIで使用"}},
    {{"id": "react", "name": "React", "level": 2, "maxLevel": 3, "exp": 45, "reason": "フロントエンド開発で使用"}},
    {{"id": "nextjs", "name": "Next.js", "level": 2, "maxLevel": 3, "exp": 40, "reason": "SSR/SSGプロジェクトで使用"}}
  ],
  "summary": "Python/TypeScriptを中心としたフルスタック開発者"
}}

重要:
- skillのidは上記リストの小文字ID（例: python, typescript, react, nextjs, fastapi）
- levelは1-3（1:初心者, 2:中級者, 3:上級者）- リポジトリ数や複雑さで判断
- expは1-100（使用頻度と深さに基づく）
- 最大15スキルまで検出してください
- 言語だけでなく、フレームワーク、ツール、ライブラリも積極的に検出してください
""")
        
        if not isinstance(result, dict) or "skills" not in result:
            logger.error("Failed to parse Gemini response for skill scan")
            return
        
        # Save skills to database
        for skill_data in result.get("skills", []):
            # Check if skill exists
            existing = db.query(SkillModel).filter(
                SkillModel.user_id == user_id,
                SkillModel.skill_id == skill_data.get("id")
            ).first()
            
            if existing:
                # Update existing skill
                existing.name = skill_data.get("name", existing.name)
                existing.level = skill_data.get("level", existing.level)
                existing.exp = skill_data.get("exp", existing.exp)
            else:
                # Create new skill
                new_skill = SkillModel(
                    user_id=user_id,
                    skill_id=skill_data.get("id"),
                    name=skill_data.get("name", ""),
                    level=skill_data.get("level", 1),
                    max_level=skill_data.get("maxLevel", 3),
                    exp=skill_data.get("exp", 0)
                )
                db.add(new_skill)
        
        db.commit()
        logger.info(f"Initial skill scan completed for user {user_id}, found {len(result.get('skills', []))} skills")
        
    except Exception as e:
        logger.error(f"Error in initial skill scan: {e}")
        db.rollback()
    finally:
        db.close()


async def get_github_token(user_id: int, db: Session) -> Optional[str]:
    """Get user's GitHub OAuth token"""
    token = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "github"
    ).first()
    
    return token.access_token if token else None


async def fetch_github_commits(access_token: str, since_days: int = 7) -> List[dict]:
    """Fetch user's recent commits from GitHub"""
    from datetime import datetime, timedelta
    
    since_date = (datetime.utcnow() - timedelta(days=since_days)).isoformat() + "Z"
    commits = []
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # First, get user's repos
        repos_response = await client.get(
            f"{GITHUB_API_URL}/user/repos",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json"
            },
            params={
                "sort": "pushed",
                "per_page": 10
            }
        )
        
        if repos_response.status_code != 200:
            logger.error(f"GitHub repos API error: {repos_response.text}")
            return []
        
        repos = repos_response.json()
        
        # Get commits from each repo
        for repo in repos[:5]:  # Limit to 5 repos
            repo_full_name = repo.get("full_name", "")
            
            commits_response = await client.get(
                f"{GITHUB_API_URL}/repos/{repo_full_name}/commits",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                params={
                    "since": since_date,
                    "per_page": 10
                }
            )
            
            if commits_response.status_code == 200:
                repo_commits = commits_response.json()
                for commit in repo_commits:
                    commit_data = commit.get("commit", {})
                    commits.append({
                        "message": commit_data.get("message", ""),
                        "files": [],  # Would need another API call to get files
                        "repo": repo_full_name
                    })
    
    return commits


@router.get("/skills", response_model=List[Skill])
async def get_skills(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get user skills from database"""
    from app.models import Skill as SkillModel
    
    # Check auth
    if not authorization or not authorization.startswith("Bearer "):
        # Return empty list if not authenticated
        return []
    
    try:
        user = get_current_user(authorization, db)
    except Exception:
        return []
    
    # Fetch skills from database
    db_skills = db.query(SkillModel).filter(SkillModel.user_id == user.id).all()
    
    return [
        Skill(
            id=s.skill_id,
            name=s.name,
            level=s.level,
            maxLevel=s.max_level,
            exp=s.exp,
            unlocked=s.unlocked
        )
        for s in db_skills
    ]


@router.post("/skills/analyze", response_model=SkillAnalysisResponse)
async def analyze_skills(
    request: SkillAnalysisRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Analyze GitHub commits and infer skills using Gemini AI
    """
    from app.services.gemini_service import get_gemini_service
    
    # Get current user
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="認証が必要です")
    
    try:
        user = get_current_user(authorization, db)
    except Exception as e:
        raise HTTPException(status_code=401, detail="認証に失敗しました")
    
    # Get GitHub token
    github_token = await get_github_token(user.id, db)
    
    if not github_token:
        raise HTTPException(status_code=400, detail="GitHub連携が必要です。設定からGitHubを連携してください。")
    
    # Fetch commits
    commits = await fetch_github_commits(github_token, request.sinceDays)
    
    if not commits:
        return SkillAnalysisResponse(
            analyzedCommits=0,
            skillUpdates=[],
            newSkillsDetected=[],
            summary="コミットが見つかりませんでした。GitHubで最近の活動があることを確認してください。"
        )
    
    # Analyze with Gemini
    service = get_gemini_service()
    result = await service.analyze_skills_from_commits(commits)
    
    # Convert to response format
    skill_updates = [
        SkillUpdate(
            skillId=update.get("skillId", ""),
            skillName=update.get("skillName"),
            expGain=update.get("expGain", 0),
            reason=update.get("reason", "")
        )
        for update in result.get("skillUpdates", [])
    ]
    
    return SkillAnalysisResponse(
        analyzedCommits=len(commits),
        skillUpdates=skill_updates,
        newSkillsDetected=result.get("newSkillsDetected", []),
        summary=result.get("summary", "分析完了")
    )


# ========================================
# Dream Analysis
# ========================================

class DreamAnalysisRequest(BaseModel):
    dream: str
    targetDuration: Optional[str] = None


class SubTask(BaseModel):
    week: str
    task: str
    freeResource: Optional[str] = None
    paidResource: Optional[str] = None


class DreamStep(BaseModel):
    id: int
    title: str
    description: str = ""
    duration: str
    status: str = "pending"
    subTasks: List[SubTask] = []


@router.post("/dream/analyze", response_model=List[DreamStep])
async def analyze_dream(
    request: DreamAnalysisRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Analyze a dream/goal and break it down into actionable steps with sub-tasks
    """
    from app.services.gemini_service import get_gemini_service
    
    # Optional: Get current user skills to personalize steps
    current_skills = []
    if authorization:
        try:
            # We use a localized import or helper to avoid circular imports? 
            # Or just duplicate get_current_user logic or use it if imported.
            # get_current_user is already imported at top of file
            user = await get_current_user(authorization.replace("Bearer ", ""), db)
            
            # Fetch skills
            skills = db.query(SkillModel).filter(
                SkillModel.user_id == user.id,
                SkillModel.level > 0
            ).all()
            current_skills = [s.id for s in skills]
            logger.info(f"Analyzing dream with skills: {current_skills}")
        except Exception as e:
            logger.warning(f"Could not fetch skills for dream analysis: {e}")
    
    service = get_gemini_service()
    steps = await service.analyze_dream(request.dream, request.targetDuration, current_skills=current_skills)
    
    # Ensure proper format
    result = []
    for i, step in enumerate(steps):
        sub_tasks = [
            SubTask(
                week=st.get("week", ""), 
                task=st.get("task", ""),
                freeResource=st.get("freeResource"),
                paidResource=st.get("paidResource")
            )
            for st in step.get("subTasks", [])
        ]
        
        result.append(DreamStep(
            id=step.get("id", i + 1),
            title=step.get("title", "ステップ"),
            description=step.get("description", ""),
            duration=step.get("duration", "未定"),
            status=step.get("status", "pending"),
            subTasks=sub_tasks
        ))
    
    return result
