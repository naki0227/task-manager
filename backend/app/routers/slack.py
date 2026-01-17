"""
Slack Router
Slack OAuth認証とメッセージ同期のエンドポイント
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from app.config import get_settings
from app.services.slack_service import SlackService
from app.services.gemini_service import get_gemini_service

router = APIRouter()
settings = get_settings()


@router.get("/auth/slack")
async def initiate_slack_oauth():
    """
    Slack OAuth認証を開始
    ユーザーをSlack認証ページにリダイレクト
    """
    scopes = [
        "channels:history",    # チャンネルメッセージ読み取り
        "channels:read",       # チャンネル情報読み取り
        "users:read"           # ユーザー情報読み取り
    ]
    
    scope_string = ",".join(scopes)
    redirect_uri = "http://localhost:8000/auth/slack/callback"
    
    auth_url = (
        f"https://slack.com/oauth/v2/authorize?"
        f"client_id={settings.slack_client_id}&"
        f"scope={scope_string}&"
        f"redirect_uri={redirect_uri}"
    )
    
    return RedirectResponse(url=auth_url)


@router.get("/auth/slack/callback")
async def slack_callback(code: str):
    """
    Slack OAuth認証のコールバック
    アクセストークンを取得してメッセージを分析
    """
    try:
        # 1. アクセストークンを取得
        access_token = await SlackService.exchange_code_for_token(code)
        
        # TODO: アクセストークンをDBに保存（後で実装）
        # await save_integration_token(service="slack", token=access_token)
        
        # 2. メッセージを取得
        messages = await SlackService.fetch_recent_messages(
            access_token=access_token,
            hours=24
        )
        
        # 3. Gemini AIでタスク抽出
        gemini = get_gemini_service()
        tasks = await gemini.extract_tasks_from_slack_messages(messages)
        
        # TODO: タスクをDBに保存（後で実装）
        # for task in tasks:
        #     await create_prepared_task(**task, source="slack")
        
        # 4. フロントエンドにリダイレクト
        return RedirectResponse(
            url=f"{settings.frontend_url}/settings?slack=connected&tasks={len(tasks)}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/slack/sync")
async def sync_slack_messages():
    """
    Slackメッセージを手動同期
    （トークンはDB保存後に実装）
    """
    # TODO: DBからトークン取得
    # access_token = await get_integration_token(service="slack")
    
    return {
        "message": "Not implemented yet - requires database integration",
        "status": "pending"
    }
