# DreamCatcher

> **"AIが準備、あとは始めるだけ"** - 自律型ライフOS

DreamCatcher（旧称 Vision）は、AIがあなたの生活と仕事を自律的にサポートする次世代のタスク管理システムです。

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Stack](https://img.shields.io/badge/Next.js-FastAPI-black)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特徴 (Key Features)

- 🤖 **AI Agent**: Gemini 2.5 Flash を搭載し、チャット形式でタスク登録や相談が可能
- 🚀 **Quick Launch**: ダッシュボードから1クリックで開発環境、会議Zoom、学習ノートを起動（デスクトップ版のみ）
- 🔄 **Infinite Context Resume**: 作業中のブラウザタブとVS Codeの状態を丸ごと保存・復元（デスクトップ版のみ）
- 📊 **Real-time Stats**: 集中時間、タスク完了数、継続日数を可視化
- 🧠 **Dream Analysis**: 漠然とした夢を具体的な実行ステップに自動分解

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
# .env を編集して GEMINI_API_KEY などを入力
```

### 3. アプリ起動
```bash
docker-compose up --build
```
ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

## ☁️ クラウド版 (Web) について

本アプリケーションはVercel等へのデプロイも可能ですが、以下の機能は**ローカル環境（デスクトップ）でのみ動作**します。クラウド環境では自動的に無効化されます。

- **Quick Launch**: アプリケーション起動機能
- **Infinite Context Resume**: ブラウザ/エディタ操作機能
- **Local File Operations**: 自動フォルダ作成など

## 🛠️ 手動セットアップ (Dockerなし)

開発者向けの手順です。

### Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js)
```bash
# プロジェクトルートで
npm install
npm run dev
```

## 📁 プロジェクト構成

```
dreamcatcher/
├── app/                    # Next.js Frontend
│   ├── snapshots/         # Context Resume UI
│   ├── stats/             # 統計 UI
│   └── ...
├── backend/                # FastAPI Python Server
│   ├── app/routers/       # API Endpoints
│   ├── app/services/      # Business Logic (Gemini, Tools)
│   └── main.py            # Entry Point
├── components/             # React Components
│   ├── dashboard/         # Dashboard Widgets (QuickLaunch etc)
│   └── ...
└── lib/                    # Shared Utilities
    └── api.ts             # API Client
```

## 📄 ライセンス

MIT License
