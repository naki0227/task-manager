# DreamCatcher

> **"AIが準備、あとは始めるだけ"** - 自律型ライフOS

DreamCatcher（旧称 Vision）は、AIがあなたの生活と仕事を自律的にサポートする次世代のタスク管理システムです。

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Stack](https://img.shields.io/badge/Next.js-FastAPI-black)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特徴 (Key Features)

- **🤖 AI Agent (Gemini 2.5)**
  - チャットで相談するだけで、漠然とした夢を具体的な「実行ステップ」に分解。
  - GitHubコミット履歴から自分のスキルを分析し、成長グラフを可視化。
  - ツール実行（タスク追加、予定確認）の履歴を自動的にログ保存。

- **🔄 All-in-One Sync**
  - **Google Calendar / Tasks**: 予定とタスクを双方向同期。
  - **Github / Linear / Slack**: 開発・コミュニケーションツールからのタスクを集約。
  - **Notion / Todoist**: ドキュメントや既存リストからのインポートに対応。

- **⏱️ Focus & Flow**
  - **Focus Timer**: ポモドーロタイマー内蔵。作業セッションを記録。
  - **Infinite Context Resume** (Local Only): 作業中のブラウザタブやVS Codeの状態を保存・一瞬で復元。
  - **Quick Launch** (Local Only): よく使うアプリやプロジェクトをワンクリック起動。

---

## 🚀 クイックスタート (Docker推奨)

Mac / Windows / Linux で最も簡単に起動する方法です。[Docker Desktop](https://www.docker.com/products/docker-desktop/) が必要です。

### 1. リポジトリのクローン
```bash
git clone https://github.com/naki0227/task-manager.git
cd task-manager
```

### 2. 環境設定
`.env.example` をコピーして `.env` を作成し、Gemini APIキーを設定してください。
```bash
cp .env.example .env
# .env を編集して GEMINI_API_KEY を入力
```

### 3. アプリ起動
```bash
docker-compose up --build
```
ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

---

## ☁️ デプロイ (Deployment)

本番環境として **Frontend (Vercel)** + **Backend (Render.com)** の構成を推奨しています。

### 必須環境変数 (Environment Variables)

| 変数名 | 説明 | 例 |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini APIキー | `AIzaSy...` |
| `DATABASE_URL` | PostgreSQL接続文字列 (Render等で取得) | `postgres://user:pass@host:5432/db` |
| `BACKEND_URL` | バックエンドのURL (末尾スラッシュなし) | `https://api.dreamcatcher.com` |
| `FRONTEND_URL` | フロントエンドのURL (末尾スラッシュなし) | `https://dreamcatcher.com` |
| `NEXT_PUBLIC_API_URL` | フロントエンドから見たAPIのURL (通常 `BACKEND_URL` と同じ) | `https://api.dreamcatcher.com` |

※ GitHub, Google, Slack等の連携を使用する場合は、それぞれの `CLIENT_ID` / `CLIENT_SECRET` も必要です。詳細は `.env.example` を参照してください。

### Vercel (Frontend)
1. `task-management` リポジトリをインポート。
2. Framework Preset: **Next.js**
3. Build Command: `next build`
4. Install Command: `npm install`
5. Environment Variables に `NEXT_PUBLIC_API_URL` を設定。

### Render (Backend)
1. Web Service を作成。
2. Build Command: `pip install -r backend/requirements.txt`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 10000` (ディレクトリは `backend` を指定)
4. Environment Variables に `DATABASE_URL`, `GEMINI_API_KEY`, `FRONTEND_URL`, `BACKEND_URL` 等を設定。

---

## 🗺️ ロードマップ (Roadmap)

現在、技術的制約によりクラウド環境で使用できない機能（Quick Launch等）の解決策として、以下のアップデートを計画しています。詳細は [docs/ROADMAP.md](docs/ROADMAP.md) または [GitHub Issues](https://github.com/naki0227/task-manager/issues) をご覧ください。

- [ ] **Desktop Native App (Electron)**: デスクトップ機能の完全サポート
- [ ] **Mobile App (React Native)**: 通知とウィジェット
- [ ] **VS Code Extension**: リアルタイムコーディング分析
- [ ] **Offline-First**: RxDBによるローカルファースト同期

---

## 🛠️ 開発者向け (Manual Setup)

Dockerを使用せず、ローカルで開発する場合の手順です。

### Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend (Next.js)
```bash
# プロジェクトルートで
npm install
npm run dev
```
Start: [http://localhost:3000](http://localhost:3000)

---

## 📁 プロジェクト構成

```
dreamcatcher/
├── app/                    # Next.js Frontend Pages
├── components/             # React Components (UI)
├── lib/                    # Utilities & API Client
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── routers/       # API Endpoints (Auth, Tasks, Chat, Sync)
│   │   ├── services/      # Business Logic (Gemini, Tools, Logging)
│   │   ├── models.py      # SQLAlchemy Models
│   │   └── main.py        # Entry Point
│   └── requirements.txt
└── docs/                   # Documentation & Spec
```

## 📄 ライセンス

MIT License
