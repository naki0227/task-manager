"""
Gemini API Service - 共通サービス
全ての機能（Slack, Gmail, GitHub等）で利用可能なGemini AI機能を提供

使い方:
1. 共通メソッド(_generate, _generate_json)を使って新機能を追加
2. 各機能専用メソッド(extract_tasks_from_slack_messages等)を追加

例:
    # Slack担当者
    gemini = get_gemini_service()
    tasks = await gemini.extract_tasks_from_slack_messages(messages)
    
    # Gmail担当者（将来実装）
    gemini = get_gemini_service()
    tasks = await gemini.extract_tasks_from_gmail(emails)
"""

import json
import google.generativeai as genai
from typing import List, Dict
from app.config import get_settings


class GeminiService:
    """
    Gemini APIとの通信を管理する共通サービス
    全ての機能（Slack, Gmail, Skills, Chat等）で利用可能
    """
    
    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
    
    # ========================================
    # 共通コアメソッド
    # ========================================
    
    async def _generate(self, prompt: str) -> str:
        """
        Gemini APIを呼び出す共通メソッド
        
        全ての機能で利用可能な基本メソッド。
        新しい機能を追加する際はこのメソッドを使用してください。
        
        Args:
            prompt: Geminiに送信するプロンプト
        
        Returns:
            Geminiのレスポンステキスト
        
        Raises:
            Exception: Gemini API呼び出しエラー
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            raise
    
    async def _generate_json(self, prompt: str) -> dict:
        """
        JSON形式のレスポンスを返すGemini呼び出し
        
        全ての機能で利用可能。JSONレスポンスが必要な場合はこちらを使用。
        
        Args:
            prompt: Geminiに送信するプロンプト
        
        Returns:
            パース済みのJSONデータ（dict または list）
        
        Raises:
            Exception: Gemini API呼び出しエラーまたはJSONパースエラー
        """
        response_text = await self._generate(prompt)
        json_text = self._extract_json(response_text)
        return json.loads(json_text)
    
    def _extract_json(self, text: str) -> str:
        """
        Geminiのレスポンスから純粋なJSONを抽出
        
        共通ユーティリティメソッド。全ての機能で利用可能。
        
        Args:
            text: Geminiのレスポンステキスト
        
        Returns:
            純粋なJSON文字列
        
        Examples:
            "```json\n[...]\n```" → "[...]"
            "説明文\n```\n{...}\n```" → "{...}"
        """
        text = text.strip()
        
        # コードブロックの除去
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        
        return text.strip()
    
    # ========================================
    # メッセージからのタスク抽出（汎用）
    # ========================================
    
    async def extract_tasks_from_messages(
        self,
        messages: List[Dict],
        source: str = "message"
    ) -> List[Dict]:
        """
        メッセージからタスク候補を抽出（汎用メソッド）
        
        Slack, Gmail, その他のメッセージソースで共通利用可能。
        各機能担当者は、このメソッドをベースに専用メソッドを作成できます。
        
        Args:
            messages: メッセージのリスト
            source: メッセージのソース ("slack", "gmail", "notion"等)
        
        Returns:
            タスク候補のリスト
            [
                {
                    "title": "タスクタイトル",
                    "description": "詳細説明",
                    "estimatedTime": "30分",
                    "priority": "medium"
                }
            ]
        """
        # メッセージを整形
        messages_text = self._format_messages(messages, source)
        
        # プロンプト作成
        prompt = f"""
以下の{source}メッセージから、アクションが必要なタスクを抽出してください。

{messages_text}

抽出基準:
- 誰かに依頼されている内容
- 期限が明示されている内容
- 確認・レビューが必要な内容
- 「TODO」「やってください」「お願い」などのキーワードを含む

以下のJSON形式で返してください:
[
    {{
        "title": "タスクのタイトル（20文字以内）",
        "description": "詳細説明",
        "estimatedTime": "推定所要時間（例: 30分）",
        "priority": "high/medium/low"
    }}
]

タスクが含まれていない場合は空配列 [] を返してください。
JSONのみを返し、他の説明文は含めないでください。
"""
        
        try:
            tasks = await self._generate_json(prompt)
            return tasks if isinstance(tasks, list) else []
        except Exception as e:
            print(f"Task extraction error: {e}")
            return []
    
    def _format_messages(self, messages: List[Dict], source: str) -> str:
        """
        メッセージをプロンプト用に整形（汎用）
        
        各ソースに応じて自動的にフォーマット。
        新しいソースを追加する場合はここにケースを追加。
        
        Args:
            messages: メッセージのリスト
            source: メッセージのソース
        
        Returns:
            整形されたメッセージテキスト
        """
        formatted = ""
        
        for msg in messages:
            if source == "slack":
                formatted += f"""
チャンネル: {msg.get('channel', 'unknown')}
メッセージ: {msg.get('text', '')}
---
"""
            elif source == "gmail":
                # Gmail担当者が実装予定
                formatted += f"""
送信者: {msg.get('from', 'unknown')}
件名: {msg.get('subject', '')}
本文: {msg.get('body', '')}
---
"""
            else:
                # デフォルト
                formatted += f"""
{msg}
---
"""
        
        return formatted
    
    # ========================================
    # Slack専用メソッド
    # ========================================
    
    async def extract_tasks_from_slack_messages(
        self, 
        messages: List[Dict]
    ) -> List[Dict]:
        """
        Slackメッセージからタスク候補を抽出（Slack専用）
        
        Slack担当者用の専用メソッド。
        内部的には汎用メソッド extract_tasks_from_messages() を使用。
        
        Args:
            messages: Slackメッセージのリスト
            [
                {"channel": "general", "text": "APIレビューお願いします"},
                {"channel": "dev", "text": "明日までにバグ修正TODO"}
            ]
        
        Returns:
            タスク候補のリスト
        """
        return await self.extract_tasks_from_messages(messages, source="slack")
    
    # ========================================
    # 他の機能用メソッド（将来拡張用）
    # ========================================
    
    # Gmail担当者が以下のように追加可能:
    # async def extract_tasks_from_gmail(self, emails: List[Dict]) -> List[Dict]:
    #     """Gmailメッセージからタスク抽出"""
    #     return await self.extract_tasks_from_messages(emails, source="gmail")
    
    # GitHub担当者が以下のように追加可能:
    # async def analyze_github_skills(self, code_samples: List[str]) -> Dict:
    #     """GitHubコミットからスキル分析"""
    #     prompt = f"以下のコードを分析..."
    #     return await self._generate_json(prompt)


    # ========================================
    # Chat Logic
    # ========================================

    async def chat(self, message: str) -> str:
        """
        Chat with Vision AI Assistant
        """
        system_prompt = """
あなたは自律型ライフOS「Vision」のAIアシスタントです。
ユーザーのタスク管理、スケジュール調整、モチベーション維持をサポートします。
親しみやすく、かつ効率的な口調で話してください。
現在はまだチャット履歴を記憶していないため、文脈に応じた回答ができない場合がありますが、
単発の質問や依頼には全力で答えてください。
"""
        prompt = f"{system_prompt}\n\nUser: {message}\nAssistant:"
        return await self._generate(prompt)

    # ========================================
    # Dream Analysis
    # ========================================

    async def analyze_dream(self, dream: str) -> list:
        """
        Analyze a dream/goal and break it down into actionable steps
        """
        prompt = f"""
ユーザーの夢/目標: {dream}

この夢を達成するための具体的なステップを5〜7個に分解してください。
各ステップには以下を含めてください:
- id: 連番 (1から開始)
- title: ステップのタイトル（簡潔に）
- duration: 推定所要期間（例: "1ヶ月", "2週間"）
- status: "pending" (固定)

以下のJSON形式で返してください:
[
  {{"id": 1, "title": "...", "duration": "...", "status": "pending"}},
  ...
]

重要:
- 現実的で達成可能なステップにする
- 順序は達成すべき順番で並べる
- 最初のステップは今すぐ始められるものにする
"""
        
        result = await self._generate_json(prompt)
        
        # Ensure we return a list
        if isinstance(result, list):
            return result
        elif isinstance(result, dict) and "steps" in result:
            return result["steps"]
        else:
            # Fallback: create a basic structure
            return [
                {"id": 1, "title": "計画を立てる", "duration": "1週間", "status": "pending"},
                {"id": 2, "title": "基礎を学ぶ", "duration": "1ヶ月", "status": "pending"},
                {"id": 3, "title": "実践する", "duration": "2ヶ月", "status": "pending"},
            ]

# シングルトンインスタンス
_gemini_service = None

def get_gemini_service() -> GeminiService:
    """GeminiServiceのインスタンスを取得"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
