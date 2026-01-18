# DreamCatcher Usage & Deployment Guide

このガイドでは、DreamCatcher (旧名 Task Manager) を本番環境（クラウド）にデプロイする手順を説明します。
推奨構成は **Frontend (Vercel)** + **Backend (Render)** + **Database (Supabase or Neon)** です。

---

## 1. データベースの準備 (PostgreSQL)

クラウド環境では SQLite が使えない（データが消える）ため、PostgreSQL を用意します。
**Supabase** または **Neon** (どちらも無料枠あり) がおすすめです。

1.  **プロジェクト作成**: アカウントを作成し、新しいプロジェクトを作成します。
2.  **接続情報の取得**:
    - `Connection String` (URI) を取得します。
    - 形式: `postgresql://user:password@host:port/database`
    - ※ Supabaseの場合、Transaction Mode (Port 6543) ではなく **Session Mode (Port 5432)** のURLを使用することを推奨します（SQLAlchemyとの相性のため）。

---

## 2. バックエンドのデプロイ (Render.com)

Backend (FastAPI) を Render にデプロイします。

1.  [Render Dashboard](https://dashboard.render.com/) にアクセスし、**New +** -> **Web Service** を選択。
2.  GitHub リポジトリ (`task-manager`) を連携・選択。
3.  以下の設定を入力:
    - **Name**: `dreamcatcher-backend` (任意)
    - **Region**: `Singapore` (日本に近い)
    - **Branch**: `feature/dream-analysis` (またはマージ後の main)
    - **Root Directory**: `backend` (重要！ここを間違えると動きません)
    - **Runtime**: `Python 3`
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4.  **Environment Variables (環境変数)** を設定:
    - ``:PYTHON_VERSION `3.11.0`
    - `DATABASE_URL`: 手順1で取得した PostgreSQL の接続文字列
    - `GEMINI_API_KEY`: 取得済みの Gemini API キー
    - `IS_CLOUD_ENV`: `true` (これを設定するとローカル限定機能が無効化され、エラーを防げます)
    - その他 (`SLACK_...`, `GOOGLE_...` 等、必要に応じて)
5.  **Create Web Service** をクリックしてデプロイ開始。
    - 成功すると、`https://dreamcatcher-backend.onrender.com` のようなURLが発行されます。これが **Backend URL** です。

---

## 3. フロントエンドのデプロイ (Vercel)

Frontend (Next.js) を Vercel にデプロイします。

1.  [Vercel Dashboard](https://vercel.com/dashboard) にアクセスし、**Add New...** -> **Project**。
2.  GitHub リポジトリ (`task-manager`) をインポート。
3.  **Configure Project**:
    - **Framework Preset**: `Next.js` (自動検出されるはずです)
    - **Root Directory**: `.` (デフォルトのまま)
4.  **Environment Variables** を設定:
    - `NEXT_PUBLIC_API_URL`: 手順2で発行された **Backend URL** (例: `https://dreamcatcher-backend.onrender.com`)
      - **注意**: 末尾に `/` をつけないでください。
      - **注意**: ローカル機能制限のため、このURLは非常に重要です。
5.  **Deploy** をクリック。

---

## 4. 動作確認

1.  Vercel で発行されたURLにアクセスします。
2.  ダッシュボードが表示されるか確認します。
3.  サイドバーの「コンテキスト (Infinite Resume)」などをクリックし、**「クラウド版では...利用できません」** という警告が表示されれれば、正常にクラウドモードで動作しています。
4.  チャット機能などを試し、バックエンドと通信できているか確認します。
