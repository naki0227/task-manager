# Vision Backend Specification

Python チームへの引き継ぎドキュメント

## 📋 概要

Vision の Backend は以下を担当します：

1. **Nexus Agent**: ローカル環境でのファイル操作、フォルダ作成、ボイラープレート生成
2. **Logic Trace**: ブラウザ/エディタ履歴から思考の繋がりを解析
3. **Value Engine**: 機会損失額とスキル経験値の計算
4. **Context Anchor**: OS レベルでの環境状態スナップショット

---

## 🔧 技術スタック

- **言語**: Python 3.11+
- **フレームワーク**: FastAPI
- **AI**: Gemini 2.5 Flash API
- **OS制御**: psutil, pygetwindow, pyautogui
- **データベース**: SQLite (ローカル) / PostgreSQL (本番)

---

## 📡 API エンドポイント仕様

### 1. Prepared Tasks (AI準備済みタスク)

#### GET `/api/prepared-tasks`

AI が準備完了したタスクの一覧を返す。

**Response:**
```json
[
  {
    "id": 1,
    "title": "Vision Frontend の続き",
    "description": "昨日の作業の続き。APIクライアントの実装",
    "preparedItems": [
      "📁 /lib/api/ フォルダを作成済み",
      "📄 client.ts のボイラープレートを生成済み"
    ],
    "estimatedTime": "45分",
    "source": "github",  // "github" | "calendar" | "slack" | "dream"
    "status": "ready"    // "ready" | "in-progress" | "completed"
  }
]
```

#### POST `/api/prepared-tasks/:id/start`

タスクを開始状態にする。  
**実装**: 関連するフォルダ/ファイルを開く、ブラウザタブを復元する等。

#### POST `/api/prepared-tasks/:id/complete`

タスクを完了状態にする。  
**実装**: スキル経験値を加算、統計を更新。

---

### 2. AI Activity (AI活動ログ)

#### GET `/api/ai-activities`

AI が実行したアクションのログを返す。

**Response:**
```json
[
  {
    "id": 1,
    "type": "folder",   // "folder" | "file" | "summary" | "analysis"
    "message": "/projects/vision-api/ を作成しました",
    "timestamp": "2分前"
  }
]
```

**WebSocket推奨**: リアルタイム更新のため、WebSocket での配信を推奨。

```
ws://localhost:8000/ws/activities
```

---

### 3. Context Snapshots (Infinite Resume)

#### GET `/api/snapshots`

保存されたコンテキストスナップショット一覧を返す。

**Response:**
```json
[
  {
    "id": 1,
    "name": "API実装作業",
    "timestamp": "2時間前",
    "windows": [
      { "type": "code", "name": "VS Code - client.ts", "path": "/path/to/file" },
      { "type": "browser", "name": "React Query Docs", "url": "https://..." }
    ],
    "notes": "fetcherの実装途中。エラーハンドリングを追加する予定。"
  }
]
```

#### POST `/api/snapshots`

現在の作業環境をスナップショットとして保存。

**Request:**
```json
{
  "name": "作業名"
}
```

**実装 (psutil/pygetwindow)**:
- アクティブなウィンドウ一覧を取得
- ブラウザタブ (Chrome/Arc) を取得
- VS Code の開いているファイルを取得

#### POST `/api/snapshots/:id/resume`

スナップショットの状態を復元。

**実装**:
- 保存されたウィンドウを開く
- ブラウザタブを復元
- VS Code で対象ファイルを開く

---

### 4. Skills (スキルデータ)

#### GET `/api/skills`

ユーザーのスキル一覧を返す。

**Response:**
```json
[
  {
    "id": "react",
    "name": "React / Next.js",
    "level": 2,
    "maxLevel": 3,
    "exp": 60,
    "unlocked": true
  }
]
```

**実装 (Gemini API)**:
- 完了したタスク/成果物を解析
- 関連スキルを特定し、経験値を加算

---

### 5. Dream Analysis (夢→ステップ分解)

#### POST `/api/dream/analyze`

夢/目標を入力すると、ステップに分解して返す。

**Request:**
```json
{
  "dream": "フルスタックエンジニアになる"
}
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "プログラミング基礎を固める",
    "duration": "2ヶ月",
    "status": "completed"
  },
  {
    "id": 2,
    "title": "Reactをマスターする",
    "duration": "3ヶ月",
    "status": "active"
  }
]
```

**実装 (Gemini API)**:
```python
prompt = f"""
ユーザーの夢: {dream}

この夢を達成するための具体的なステップを5〜7個に分解してください。
各ステップには以下を含めてください:
- title: ステップのタイトル
- duration: 推定所要期間
- status: "pending" (固定)

JSON形式で返してください。
"""
```

---

### 6. Loss Data (機会損失)

#### GET `/api/loss-data`

現在の機会損失データを返す。

**Response:**
```json
{
  "hourlyRate": 3000,
  "idleMinutes": 45
}
```

**実装**:
- 最後のアクティビティからの経過時間を計算
- ユーザー設定の時給を取得

---

## 🔐 OAuth 連携

### GitHub

Frontend から `/auth/github` にリダイレクト。

```python
# callback 処理
@app.get("/auth/github/callback")
async def github_callback(code: str):
    # アクセストークンを取得
    # ユーザー情報を取得
    # リポジトリ/Issue を取得してタスク化
```

### Google Calendar

```python
@app.get("/auth/google/callback")
async def google_callback(code: str):
    # カレンダーイベントを取得
    # タスクとして準備
```

### Google Tasks

```python
@app.get("/auth/google-tasks/callback")
async def google_tasks_callback(code: str):
    # Google Tasks API でタスクリストを取得
    # Vision タスクと双方向同期
    
# スコープ: https://www.googleapis.com/auth/tasks
# 参考: https://developers.google.com/tasks/reference/rest
```

### Gmail

```python
@app.get("/auth/gmail/callback")
async def gmail_callback(code: str):
    # Gmail API でメールを取得
    # Gemini で解析して、タスク候補を抽出
    # 例: 「〜してください」「deadline: 〜」などのパターン
    
# スコープ: https://www.googleapis.com/auth/gmail.readonly
# フィルタ: 未読、重要ラベル、特定の送信者など
```

### Notion

```python
@app.get("/auth/notion/callback")
async def notion_callback(code: str):
    # Notion API でページ/データベースを取得
    # タスクDBと双方向同期
    # ドキュメントをコンテキストとして保存

# スコープ: read_content, update_content
# 参考: https://developers.notion.com/reference/intro
```

### Slack

```python
@app.get("/auth/slack/callback")
async def slack_callback(code: str):
    # メッセージを取得
    # AI で分析してタスク候補を抽出
```

### Linear

```python
@app.get("/auth/linear/callback")
async def linear_callback(code: str):
    # Linear API で Issue を取得
    # Vision タスクとして準備
    
# 参考: https://developers.linear.app/docs/graphql/working-with-the-graphql-api
```

### Todoist

```python
@app.get("/auth/todoist/callback")
async def todoist_callback(code: str):
    # Todoist REST API でタスクを取得
    # Vision タスクと双方向同期
    
# 参考: https://developer.todoist.com/rest/v2/
```

### Discord

```python
@app.get("/auth/discord/callback")
async def discord_callback(code: str):
    # Discord Bot でサーバー通知を取得
    # メンション、DM をタスク候補として抽出
    
# 参考: https://discord.com/developers/docs/intro
```

### Apple Calendar (CalDAV)

```python
# Apple Calendar は CalDAV プロトコルで接続
# iCloud 連携には App-Specific Password が必要

async def sync_apple_calendar(username: str, app_password: str):
    # caldav ライブラリで iCloud カレンダーに接続
    # イベントを取得してタスク化
    
# pip install caldav
# 参考: https://www.icloud.com/calendar/
```

### Obsidian (ローカル連携)

```python
# Obsidian はローカルファイルベースのため OAuth 不要
# ユーザーが Vault パスを指定

async def watch_obsidian_vault(vault_path: str):
    # watchdog でファイル変更を監視
    # デイリーノートからタスクを抽出
    # TODOリスト (- [ ]) をパース
    
# pip install watchdog
```

---

## 📁 推奨ディレクトリ構成

```
vision-backend/
├── app/
│   ├── main.py              # FastAPI エントリポイント
│   ├── routers/
│   │   ├── tasks.py         # /api/prepared-tasks
│   │   ├── activities.py    # /api/ai-activities
│   │   ├── snapshots.py     # /api/snapshots
│   │   ├── skills.py        # /api/skills
│   │   └── auth.py          # OAuth
│   ├── services/
│   │   ├── nexus_agent.py   # ファイル操作
│   │   ├── context_anchor.py # スナップショット
│   │   ├── value_engine.py  # 損失計算
│   │   └── gemini.py        # AI 呼び出し
│   ├── models/
│   │   └── schemas.py       # Pydantic モデル
│   └── db/
│       └── database.py      # DB 接続
├── requirements.txt
└── .env.example
```

---

## 🚀 起動方法

```bash
# 仮想環境を作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係をインストール
pip install -r requirements.txt

# 環境変数を設定
cp .env.example .env
# GEMINI_API_KEY, GITHUB_CLIENT_ID 等を設定

# 開発サーバーを起動
uvicorn app.main:app --reload --port 8000
```

---

## 📝 .env.example

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
# Gmail uses same Google OAuth with different scopes

# Database
DATABASE_URL=sqlite:///./vision.db

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 🤝 連携のポイント

1. **CORS 設定**: Frontend (localhost:3000) からのリクエストを許可
2. **WebSocket**: AI Activity はリアルタイム更新が望ましい
3. **エラーハンドリング**: 適切な HTTP ステータスコードを返す
4. **型定義**: Frontend の `lib/api.ts` と同期を保つ

質問があれば Slack で！
