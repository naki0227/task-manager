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
from sqlalchemy.orm import Session
from app.services.tools import AVAILABLE_TOOLS, TOOL_FUNCTIONS
import google.generativeai.protos as protos


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

    # ========================================
    # Chat Logic
    # ========================================
    async def chat(self, message: str, user_id: int = None, db: Session = None) -> str:
        """
        Chat with Vision AI Assistant with Function Calling support
        """
        system_prompt = """
あなたは自律型ライフOS「DreamCatcher」のAIアシスタントです。
ユーザーのタスク管理、スケジュール調整、スキル習得をサポートします。
利用可能なツール（関数）がある場合は、適切に使用してユーザーの要望に応えてください。
ツールを使用した場合は、その結果を踏まえて最終的な回答をしてください。
親しみやすく、かつ効率的な口調で話してください。
"""
        
        # Simple loop for function calling (max 3 turns to prevent infinite loops)
        messages = [
            {"role": "user", "parts": [system_prompt + "\n\n" + message]}
        ]
        
        try:
            # First turn: User -> Model
            response = self.model.generate_content(
                messages,
                tools=AVAILABLE_TOOLS
            )
            
            # Helper to check for function call
            def get_function_call(response):
                if not response.candidates: return None
                for part in response.candidates[0].content.parts:
                    if part.function_call:
                        return part.function_call
                return None

            function_call = get_function_call(response)
            
            # Loop if function call
            turn_count = 0
            while function_call and turn_count < 3:
                turn_count += 1
                func_name = function_call.name
                func_args = dict(function_call.args)
                
                print(f"Executing tool: {func_name} with args: {func_args}")
                
                # Execute tool
                result = {"error": "Function not found"}
                if func_name in TOOL_FUNCTIONS:
                    func = TOOL_FUNCTIONS[func_name]
                    # Inject dependencies if supported
                    try:
                        import inspect
                        sig = inspect.signature(func)
                        kwargs = {}
                        for k, v in func_args.items():
                            kwargs[k] = v
                        
                        # Inject special args if present in signature
                        if "user_id" in sig.parameters:
                            kwargs["user_id"] = user_id
                        if "db" in sig.parameters:
                            kwargs["db"] = db
                            
                        result = await func(**kwargs)
                    except Exception as e:
                        print(f"Tool execution error: {e}")
                        result = {"error": str(e)}
                
                # Send result back to model
                # We need to reconstruct history for the stateless call
                # But generate_content accepts a list of messages (history)
                
                # Add Model's Function Call to history
                messages.append(response.candidates[0].content)
                
                # Add Function Response to history
                messages.append({
                    "role": "function",
                    "parts": [
                        protos.Part(
                            function_response=protos.FunctionResponse(
                                name=func_name,
                                response={"result": result}
                            )
                        )
                    ]
                })
                
                # Generate next response
                response = self.model.generate_content(
                    messages,
                    tools=AVAILABLE_TOOLS
                )
                function_call = get_function_call(response)
                
            return response.text
            
        except Exception as e:
            print(f"Chat Error details: {e}")
            raise e

    # ========================================
    # Dream Analysis
    # ========================================

    async def analyze_dream(self, dream: str, target_duration: str = None, current_skills: list[str] = None) -> list:
        """
        Analyze a dream/goal and break it down into actionable steps with sub-tasks
        """
        duration_context = ""
        if target_duration:
            duration_context = f"\n目標達成期間: {target_duration}\nこの期間内に達成できるよう、ステップを調整してください。"
        
        skill_context = ""
        if current_skills and len(current_skills) > 0:
            skill_context = f"\nユーザーの現在の習得スキル: {', '.join(current_skills)}\nこれらを踏まえ、習得済みのスキルについては基礎学習を省略し、応用や実践的なステップから開始してください。逆に未習得のスキルが必要な場合は、その学習リソースを具体的に提示してください。"
        
        prompt = f"""
ユーザーの夢/目標: {dream}{duration_context}{skill_context}

この夢を達成するための具体的なステップを5〜7個に分解してください。
各ステップには週単位のサブタスクも含め、具体的な学習リソースを推薦してください。

各ステップには以下を含めてください:
- id: 連番 (1から開始)
- title: ステップのタイトル（簡潔に）
- description: ステップの具体的な説明（1-2文）
- duration: 推定所要期間（例: "1ヶ月", "2週間"）
- status: "pending" (固定)
- subTasks: 週単位の具体的なタスクの配列
  - week: 週の範囲（例: "Week 1-2"）
  - task: 具体的なタスク内容（何をどこまでやるか明確に）
  - freeResource: 無料で使えるおすすめサイト/アプリ/教材（名前とURL）
  - paidResource: (オプション) 有料だがおすすめのリソース（名前と価格帯）

以下のJSON形式で返してください:
[
  {{
    "id": 1,
    "title": "プログラミング基礎を固める",
    "description": "変数、関数、制御構文など基本的なプログラミング概念を習得する",
    "duration": "2ヶ月",
    "status": "pending",
    "subTasks": [
      {{
        "week": "Week 1-2",
        "task": "Pythonの変数と型を理解し、簡単な計算プログラムを書く",
        "freeResource": "Progate Python基礎編 (https://prog-8.com/)",
        "paidResource": "Udemy Python講座 (約2,000円セール時)"
      }},
      {{
        "week": "Week 3-4",
        "task": "if文、for文、while文を使った制御構文をマスター",
        "freeResource": "paiza ラーニング (https://paiza.jp/works)",
        "paidResource": null
      }}
    ]
  }},
  ...
]

重要:
- 現実的で達成可能なステップにする
- 各ステップに2-4個のサブタスクを含める
- サブタスクは「何を」「どこまで」やるか具体的に書く
- freeResourceは必ず含める（無料のサイト/アプリ/YouTube等）
- paidResourceは良質なものがある場合のみ（なければnull）
- 順序は達成すべき順番で並べる
- 最初のステップは今すぐ始められるものにする
"""
        
        result = await self._generate_json(prompt)
        
        # Ensure we return a list with proper structure
        if isinstance(result, list):
            # Ensure each step has subTasks
            for step in result:
                if "subTasks" not in step:
                    step["subTasks"] = []
                if "description" not in step:
                    step["description"] = ""
            return result
        elif isinstance(result, dict) and "steps" in result:
            return result["steps"]
        else:
            # Fallback
            return [
                {
                    "id": 1, 
                    "title": "計画を立てる", 
                    "description": "目標達成のための具体的な計画を策定する",
                    "duration": "1週間", 
                    "status": "pending",
                    "subTasks": [
                        {"week": "Week 1", "task": "現状分析と目標設定"}
                    ]
                },
            ]

    # ========================================
    # Skills Analysis
    # ========================================

    async def analyze_skills_from_commits(self, commits: list) -> dict:
        """
        Analyze GitHub commits to infer programming skills
        
        Args:
            commits: List of commit objects with message, files, changes
        
        Returns:
            {
                "skillUpdates": [{"skillId": "python", "expGain": 10, "reason": "..."}],
                "newSkillsDetected": ["rust", "go"],
                "summary": "分析結果のサマリー"
            }
        """
        if not commits:
            return {
                "skillUpdates": [],
                "newSkillsDetected": [],
                "summary": "コミットが見つかりませんでした"
            }
        
        # Format commits for analysis
        commit_text = "\n".join([
            f"- {c.get('message', '')} ({', '.join(c.get('files', [])[:5])})"
            for c in commits[:30]  # Limit to 30 commits
        ])
        
        prompt = f"""
以下のGitHubコミット履歴を分析し、ユーザーのプログラミングスキルを推測してください。

コミット履歴:
{commit_text}

以下を分析してください:
1. 使用されている言語/フレームワーク
2. スキルレベル（初心者/中級者/上級者）
3. 経験値の増加量

以下のJSON形式で返してください:
{{
  "skillUpdates": [
    {{
      "skillId": "python",
      "skillName": "Python",
      "expGain": 15,
      "reason": "FastAPIを使ったバックエンド開発"
    }},
    {{
      "skillId": "typescript",
      "skillName": "TypeScript",
      "expGain": 10,
      "reason": "React/Next.jsでのフロントエンド開発"
    }}
  ],
  "newSkillsDetected": ["fastapi", "sqlalchemy"],
  "summary": "Python/TypeScriptをメインに、FastAPIを使ったフルスタック開発を行っています"
}}

重要:
- skillIdは小文字英数字（例: python, typescript, react, nextjs）
- expGainは1-20の範囲（多いほど深い関与）
- newSkillsDetectedは初めて検出されたスキル
- summaryは日本語で1-2文
"""
        
        result = await self._generate_json(prompt)
        
        # Ensure proper structure
        if isinstance(result, dict):
            return {
                "skillUpdates": result.get("skillUpdates", []),
                "newSkillsDetected": result.get("newSkillsDetected", []),
                "summary": result.get("summary", "分析完了")
            }
        else:
            return {
                "skillUpdates": [],
                "newSkillsDetected": [],
                "summary": "分析結果の解析に失敗しました"
            }

# シングルトンインスタンス
_gemini_service = None

def get_gemini_service() -> GeminiService:
    """GeminiServiceのインスタンスを取得"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
