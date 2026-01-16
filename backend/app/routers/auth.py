"""
OAuth Authentication Router
GitHub, Google, Slack, Notion, Linear, Todoist, Discord
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import httpx
from app.config import get_settings

router = APIRouter()
settings = get_settings()

# ===================
# GitHub OAuth
# ===================
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"


@router.get("/github")
async def github_login():
    """Redirect to GitHub OAuth"""
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/github/callback",
        "scope": "read:user repo",
    }
    url = f"{GITHUB_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/github/callback")
async def github_callback(code: str):
    """Handle GitHub OAuth callback"""
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
        
        # TODO: Store token and user info in database
        # TODO: Create session
        
        # Redirect back to frontend
        return RedirectResponse(url=f"{settings.frontend_url}/settings?github=connected")


# ===================
# Google OAuth (Calendar, Tasks, Gmail)
# ===================
GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google")
async def google_login():
    """Redirect to Google OAuth"""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/gmail.readonly",
        "access_type": "offline",
        "prompt": "consent",
    }
    url = f"{GOOGLE_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback"""
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
        
        # TODO: Store tokens in database
        
        return RedirectResponse(url=f"{settings.frontend_url}/settings?google=connected")


# ===================
# Slack OAuth
# ===================
SLACK_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize"
SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access"


@router.get("/slack")
async def slack_login():
    """Redirect to Slack OAuth"""
    params = {
        "client_id": settings.slack_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/slack/callback",
        "scope": "channels:history,channels:read,chat:write,users:read",
    }
    url = f"{SLACK_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/slack/callback")
async def slack_callback(code: str):
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
        team = token_data.get("team", {})
        
        # TODO: Store token in database
        
        return RedirectResponse(url=f"{settings.frontend_url}/settings?slack=connected")


# ===================
# Notion OAuth
# ===================
NOTION_AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize"
NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token"


@router.get("/notion")
async def notion_login():
    """Redirect to Notion OAuth"""
    params = {
        "client_id": settings.notion_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/notion/callback",
        "response_type": "code",
        "owner": "user",
    }
    url = f"{NOTION_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/notion/callback")
async def notion_callback(code: str):
    """Handle Notion OAuth callback"""
    import base64
    
    async with httpx.AsyncClient() as client:
        credentials = base64.b64encode(
            f"{settings.notion_client_id}:{settings.notion_client_secret}".encode()
        ).decode()
        
        token_response = await client.post(
            NOTION_TOKEN_URL,
            json={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/notion/callback",
            },
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json",
            },
        )
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data.get("error", "OAuth failed"))
        
        access_token = token_data["access_token"]
        
        # TODO: Store token in database
        
        return RedirectResponse(url=f"{settings.frontend_url}/settings?notion=connected")


# ===================
# Discord OAuth
# ===================
DISCORD_AUTHORIZE_URL = "https://discord.com/api/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"


@router.get("/discord")
async def discord_login():
    """Redirect to Discord OAuth"""
    params = {
        "client_id": settings.discord_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/discord/callback",
        "response_type": "code",
        "scope": "identify guilds messages.read",
    }
    url = f"{DISCORD_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/discord/callback")
async def discord_callback(code: str):
    """Handle Discord OAuth callback"""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            DISCORD_TOKEN_URL,
            data={
                "client_id": settings.discord_client_id,
                "client_secret": settings.discord_client_secret,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/discord/callback",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data.get("error_description", "OAuth failed"))
        
        access_token = token_data["access_token"]
        
        # TODO: Store token in database
        
        return RedirectResponse(url=f"{settings.frontend_url}/settings?discord=connected")


# ===================
# Linear OAuth
# ===================
LINEAR_AUTHORIZE_URL = "https://linear.app/oauth/authorize"
LINEAR_TOKEN_URL = "https://api.linear.app/oauth/token"


@router.get("/linear")
async def linear_login():
    """Redirect to Linear OAuth"""
    params = {
        "client_id": settings.linear_client_id,
        "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/linear/callback",
        "response_type": "code",
        "scope": "read write",
    }
    url = f"{LINEAR_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/linear/callback")
async def linear_callback(code: str):
    """Handle Linear OAuth callback"""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            LINEAR_TOKEN_URL,
            data={
                "client_id": settings.linear_client_id,
                "client_secret": settings.linear_client_secret,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": f"{settings.frontend_url.replace('3000', '8000')}/auth/linear/callback",
            },
        )
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data.get("error", "OAuth failed"))
        
        access_token = token_data["access_token"]
        
        # TODO: Store token in database
        
        return RedirectResponse(url=f"{settings.frontend_url}/settings?linear=connected")


# ===================
# Todoist OAuth
# ===================
TODOIST_AUTHORIZE_URL = "https://todoist.com/oauth/authorize"
TODOIST_TOKEN_URL = "https://todoist.com/oauth/access_token"


@router.get("/todoist")
async def todoist_login():
    """Redirect to Todoist OAuth"""
    params = {
        "client_id": settings.todoist_client_id,
        "scope": "data:read_write",
        "state": "vision",
    }
    url = f"{TODOIST_AUTHORIZE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return RedirectResponse(url=url)


@router.get("/todoist/callback")
async def todoist_callback(code: str, state: str = ""):
    """Handle Todoist OAuth callback"""
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            TODOIST_TOKEN_URL,
            data={
                "client_id": settings.todoist_client_id,
                "client_secret": settings.todoist_client_secret,
                "code": code,
            },
        )
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data.get("error", "OAuth failed"))
        
        access_token = token_data["access_token"]
        
        # TODO: Store token in database
        
        return RedirectResponse(url=f"{settings.frontend_url}/settings?todoist=connected")
