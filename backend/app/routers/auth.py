"""
OAuth Authentication Router with Account Linking
GitHub, Google, Slack, Notion, Linear, Todoist, Discord
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import RedirectResponse
import httpx
from sqlalchemy.orm import Session
from datetime import datetime

from app.config import get_settings
from app.database import get_db
from app.models import User, OAuthToken
from app.routers.login import create_access_token

router = APIRouter()
settings = get_settings()

# ===================
# Helper: Link or Create User
# ===================
async def get_or_create_user_by_email(email: str, name: str, db: Session) -> User:
    """Find existing user by email or create new one"""
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        user = User(email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user


async def save_oauth_token(user_id: int, provider: str, access_token: str, refresh_token: str = None, db: Session = None):
    """Save or update OAuth token"""
    existing = db.query(OAuthToken).filter(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == provider
    ).first()
    
    if existing:
        existing.access_token = access_token
        existing.refresh_token = refresh_token
        existing.updated_at = datetime.utcnow()
    else:
        token = OAuthToken(
            user_id=user_id,
            provider=provider,
            access_token=access_token,
            refresh_token=refresh_token,
        )
        db.add(token)
    
    db.commit()


# ===================
# GitHub OAuth
# ===================
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


@router.get("/github")
async def github_login(authorization: str = Header(None), token: str = None, db: Session = Depends(get_db)):
    """Redirect to GitHub OAuth"""
    # Check if user is already logged in to link account
    state = ""
    if authorization and authorization.startswith("Bearer "):
        try:
            from app.routers.users import get_current_user
            user = get_current_user(authorization, db)
            state = str(user.id)
        except Exception:
            pass
    elif token:
        try:
            from app.routers.login import SECRET_KEY, ALGORITHM
            from jose import jwt
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            if user_id:
                state = str(user_id)
        except Exception:
            pass

    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/github/callback",
        "scope": "read:user user:email repo",
        "state": state,
    }
    url = f"{GITHUB_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/github/callback")
async def github_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback with account linking"""
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data["error_description"])
        
        access_token = token_data["access_token"]
        
        # Get user info
        user_response = await client.get(
            GITHUB_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_data = user_response.json()
        
        # Get primary email
        emails_response = await client.get(
            GITHUB_EMAILS_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        emails = emails_response.json()
        primary_email = next(
            (e["email"] for e in emails if e.get("primary")),
            user_data.get("email")
        )
        
        if not primary_email:
            raise HTTPException(status_code=400, detail="メールアドレスが取得できませんでした")
        
        user = None
        # 1. Try to link to existing user from state
        if state and state.isdigit():
            user_id = int(state)
            user = db.query(User).filter(User.id == user_id).first()

        # 2. If no state or user not found, find/create by email
        if not user:
            user = await get_or_create_user_by_email(
                email=primary_email,
                name=user_data.get("name") or user_data.get("login"),
                db=db
            )
        
        # Save OAuth token
        await save_oauth_token(user.id, "github", access_token, db=db)
        
        # Create JWT for frontend
        jwt_token = create_access_token({"sub": user.email, "user_id": user.id})
        
        # Redirect back to frontend with token
        return RedirectResponse(
            url=f"{settings.frontend_url}/settings?github=connected&token={jwt_token}&user={user.email}"
        )


# ===================
# Google OAuth (Calendar, Tasks, Gmail)
# ===================
GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google")
async def google_login(authorization: str = Header(None), token: str = None, db: Session = Depends(get_db)):
    """Redirect to Google OAuth with all scopes"""
    # Check if user is already logged in to link account
    state = ""
    # Check Header
    if authorization and authorization.startswith("Bearer "):
        try:
            from app.routers.users import get_current_user
            user = get_current_user(authorization, db)
            state = str(user.id)
        except Exception:
            pass
    # Check Query Param (for frontend redirects)
    elif token:
        try:
            from app.routers.login import SECRET_KEY, ALGORITHM
            from jose import jwt
            # Manual verify because get_current_user expects header
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            if user_id:
                state = str(user_id)
        except Exception:
            pass

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/google/callback",
        "response_type": "code",
        "scope": " ".join([
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/tasks",
            "https://www.googleapis.com/auth/gmail.readonly",
        ]),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    url = f"{GOOGLE_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def google_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    """Handle Google OAuth callback with account linking"""
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/google/callback",
            },
        )
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data.get("error_description", "OAuth failed"))
        
        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")
        
        # Get user info
        user_response = await client.get(
            GOOGLE_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_data = user_response.json()
        
        email = user_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="メールアドレスが取得できませんでした")
        
        user = None
        # 1. Try to link to existing user from state
        if state and state.isdigit():
            user_id = int(state)
            user = db.query(User).filter(User.id == user_id).first()
            
        # 2. If no state or user not found, find/create by email
        if not user:
            user = await get_or_create_user_by_email(
                email=email,
                name=user_data.get("name", ""),
                db=db
            )
        
        # Save OAuth token (Link account)
        await save_oauth_token(user.id, "google", access_token, refresh_token, db)
        
        # Create JWT for frontend
        jwt_token = create_access_token({"sub": user.email, "user_id": user.id})
        
        return RedirectResponse(
            url=f"{settings.frontend_url}/settings?google=connected&token={jwt_token}&user={user.email}"
        )



# ===================
# Slack OAuth
# ===================
SLACK_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize"
SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access"


@router.get("/slack")
async def slack_login(authorization: str = Header(None), token: str = None, db: Session = Depends(get_db)):
    """Redirect to Slack OAuth"""
    # Check if user is already logged in to link account
    state = ""
    if authorization and authorization.startswith("Bearer "):
        try:
            from app.routers.users import get_current_user
            user = get_current_user(authorization, db)
            state = str(user.id)
        except Exception:
            pass
    elif token:
        try:
            from app.routers.login import SECRET_KEY, ALGORITHM
            from jose import jwt
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            if user_id:
                state = str(user_id)
        except Exception:
            pass

    params = {
        "client_id": settings.slack_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/slack/callback",
        "scope": "channels:history,channels:read,chat:write,users:read,users:read.email",
        "state": state,
    }
    url = f"{SLACK_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/slack/callback")
async def slack_callback(code: str, state: str = "", db: Session = Depends(get_db)):
    """Handle Slack OAuth callback"""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            SLACK_TOKEN_URL,
            data={
                "client_id": settings.slack_client_id,
                "client_secret": settings.slack_client_secret,
                "code": code,
            },
        )
        token_data = token_response.json()
        
        if not token_data.get("ok"):
            raise HTTPException(status_code=400, detail=token_data.get("error", "OAuth failed"))
            
        access_token = token_data["access_token"]
        
        # Get user info (requires users:read and users:read.email scope)
        user_response = await client.get(
            "https://slack.com/api/users.identity",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_data = user_response.json()
        
        # Fallback to test without identity if scope missing, but ideally we need email
        # If user.identity fails, try users.info with authed_user_id
        email = None
        slack_user_id = token_data.get("authed_user", {}).get("id")
        
        if not email and slack_user_id:
             info_res = await client.get(
                "https://slack.com/api/users.info",
                params={"user": slack_user_id},
                headers={"Authorization": f"Bearer {access_token}"}
             )
             info_data = info_res.json()
             if info_data.get("ok"):
                 email = info_data["user"]["profile"].get("email")
                 
        user = None
        if state and state.isdigit():
            user_id = int(state)
            user = db.query(User).filter(User.id == user_id).first()
            
        if not user and email:
             user = await get_or_create_user_by_email(email, "Slack User", db)
        
        if user:
            await save_oauth_token(user.id, "slack", access_token, db=db)
            jwt_token = create_access_token({"sub": user.email, "user_id": user.id})
            return RedirectResponse(url=f"{settings.frontend_url}/settings?slack=connected&token={jwt_token}&user={user.email}")
            
        return RedirectResponse(url=f"{settings.frontend_url}/settings?slack=connected")


# ===================
# Other OAuth endpoints (simplified)
# ===================
@router.get("/notion")
async def notion_login(authorization: str = Header(None), token: str = None, db: Session = Depends(get_db)):
    # Check if user is already logged in to link account
    state = ""
    if authorization and authorization.startswith("Bearer "):
        try:
            from app.routers.users import get_current_user
            user = get_current_user(authorization, db)
            state = str(user.id)
        except Exception:
            pass
    elif token:
        try:
            from app.routers.login import SECRET_KEY, ALGORITHM
            from jose import jwt
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            if user_id:
                state = str(user_id)
        except Exception:
            pass

    params = {
        "client_id": settings.notion_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/notion/callback",
        "response_type": "code",
        "owner": "user",
        "state": state,
    }
    url = f"https://api.notion.com/v1/oauth/authorize?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/notion/callback")
async def notion_callback(code: str, state: str = ""):
    return RedirectResponse(url=f"{settings.frontend_url}/settings?notion=connected")


@router.get("/discord")
async def discord_login(authorization: str = Header(None), token: str = None, db: Session = Depends(get_db)):
    # Check if user is already logged in to link account
    state = ""
    if authorization and authorization.startswith("Bearer "):
        try:
            from app.routers.users import get_current_user
            user = get_current_user(authorization, db)
            state = str(user.id)
        except Exception:
            pass
    elif token:
        try:
            from app.routers.login import SECRET_KEY, ALGORITHM
            from jose import jwt
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            if user_id:
                state = str(user_id)
        except Exception:
            pass

    params = {
        "client_id": settings.discord_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/discord/callback",
        "response_type": "code",
        "scope": "identify guilds messages.read",
        "state": state,
    }
    url = f"https://discord.com/api/oauth2/authorize?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/discord/callback")
async def discord_callback(code: str, state: str = ""):
    return RedirectResponse(url=f"{settings.frontend_url}/settings?discord=connected")


@router.get("/linear")
async def linear_login(authorization: str = Header(None), token: str = None, db: Session = Depends(get_db)):
    state = ""
    if authorization and authorization.startswith("Bearer "):
        try:
            from app.routers.users import get_current_user
            user = get_current_user(authorization, db)
            state = str(user.id)
        except Exception:
            pass
    elif token:
        try:
            from app.routers.login import SECRET_KEY, ALGORITHM
            from jose import jwt
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            if user_id:
                state = str(user_id)
        except Exception:
            pass

    params = {
        "client_id": settings.linear_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/linear/callback",
        "response_type": "code",
        "scope": "read write",
        "state": state,
    }
    url = f"https://linear.app/oauth/authorize?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/linear/callback")
async def linear_callback(code: str, state: str = ""):
    return RedirectResponse(url=f"{settings.frontend_url}/settings?linear=connected")


@router.get("/todoist")
async def todoist_login(authorization: str = Header(None), token: str = None, db: Session = Depends(get_db)):
    state = "vision"
    if authorization and authorization.startswith("Bearer "):
        try:
            from app.routers.users import get_current_user
            user = get_current_user(authorization, db)
            state = str(user.id)
        except Exception:
            pass
    elif token:
        try:
            from app.routers.login import SECRET_KEY, ALGORITHM
            from jose import jwt
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            if user_id:
                state = str(user_id)
        except Exception:
            pass

    params = {
        "client_id": settings.todoist_client_id,
        "scope": "data:read_write",
        "state": state,
    }
    url = f"https://todoist.com/oauth/authorize?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/todoist/callback")
async def todoist_callback(code: str, state: str = ""):
    return RedirectResponse(url=f"{settings.frontend_url}/settings?todoist=connected")
