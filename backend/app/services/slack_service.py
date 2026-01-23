"""
Slack API Service
Slack APIとの通信を管理
"""

import requests
from slack_sdk import WebClient
from typing import List, Dict
from datetime import datetime, timedelta
from app.config import get_settings


class SlackService:
    """Slack APIとの通信を管理"""
    
    @staticmethod
    async def exchange_code_for_token(code: str) -> str:
        """
        OAuth認証コードをアクセストークンに交換
        
        Args:
            code: Slackから返された認証コード
        
        Returns:
            アクセストークン
        """
        settings = get_settings()
        
        response = requests.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "client_id": settings.slack_client_id,
                "client_secret": settings.slack_client_secret,
                "code": code
            }
        )
        
        data = response.json()
        
        if not data.get("ok"):
            raise Exception(f"Slack OAuth error: {data.get('error')}")
        
        return data["access_token"]
    
    @staticmethod
    async def fetch_recent_messages(
        access_token: str, 
        hours: int = 24
    ) -> List[Dict]:
        """
        Slackから最近のメッセージを取得
        
        Args:
            access_token: Slackアクセストークン
            hours: 取得する過去時間数（デフォルト24時間）
        
        Returns:
            メッセージのリスト
            [
                {"channel": "general", "text": "メッセージ内容"},
                ...
            ]
        """
        client = WebClient(token=access_token)
        
        # 参加しているチャンネル一覧を取得
        channels_response = client.conversations_list()
        channels = channels_response["channels"]
        
        # タイムスタンプ計算（過去N時間）
        oldest_timestamp = (datetime.now() - timedelta(hours=hours)).timestamp()
        
        all_messages = []
        
        # 各チャンネルからメッセージを取得
        for channel in channels:
            # 参加しているチャンネルのみ
            if channel["is_member"]:
                try:
                    history = client.conversations_history(
                        channel=channel["id"],
                        oldest=str(oldest_timestamp)
                    )
                    
                    # メッセージをフィルタリング
                    for message in history.get("messages", []):
                        text = message.get("text", "")
                        
                        # タスク関連キーワードを含むもの
                        if SlackService._contains_task_keywords(text):
                            all_messages.append({
                                "channel": channel["name"],
                                "text": text,
                                "timestamp": message.get("ts")
                            })
                
                except Exception as e:
                    print(f"Error fetching channel {channel['name']}: {e}")
                    continue
        
        return all_messages
    
    @staticmethod
    def _contains_task_keywords(text: str) -> bool:
        """タスク関連のキーワードを含むか判定"""
        keywords = [
            "TODO", "todo", "やってください", "お願い", "確認",
            "レビュー", "期限", "deadline", "締切", "までに"
        ]
        
        for keyword in keywords:
            if keyword in text:
                return True
        
        return False
        
    @staticmethod
    async def post_message(access_token: str, channel_id: str, text: str) -> None:
        """
        Slackチャンネルでメッセージを投稿
        """
        client = WebClient(token=access_token)
        try:
             client.chat_postMessage(channel=channel_id, text=text)
        except Exception as e:
             raise Exception(f"Failed to post Slack message: {e}")
