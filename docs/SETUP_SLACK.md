# Slack連携機能 セットアップガイド

このドキュメントでは、Slack連携機能をローカル環境で動作させるための手順を説明します。

## 前提条件

- Python 3.10以上
- ngrok（HTTPSトンネル用）
- Slack Appの作成権限

---

## 1. ngrokのインストールと起動

Slack OAuthにはHTTPSが必須です。ローカル開発では`ngrok`を使用します。

```bash
# インストール（Windows）
winget install ngrok.ngrok

# アカウント設定（初回のみ）
ngrok config add-authtoken YOUR_AUTH_TOKEN

# 起動
ngrok http 8000
```

起動後に表示される `https://xxxx.ngrok-free.dev` をメモしてください。

---

## 2. Slack Appの作成・設定

1. [Slack API](https://api.slack.com/apps) にアクセス
2. 「Create New App」→「From scratch」を選択
3. アプリ名とワークスペースを設定

### OAuth & Permissions設定

左メニュー「OAuth & Permissions」で以下を設定：

**Redirect URLs:**
```
https://YOUR_NGROK_URL/auth/slack/callback
```

**User Token Scopes:**
- `channels:history`
- `channels:read`
- `chat:write`
- `users:read`
- `users:read.email`

### App Home設定

左メニュー「App Home」でBot Display Nameを設定（Bot Userの作成に必要）

### 認証情報の取得

「Basic Information」から以下をコピー：
- Client ID
- Client Secret

---

## 3. 環境変数の設定

`backend/.env` ファイルを作成し、以下を設定：

```env
SLACK_CLIENT_ID=取得したClient ID
SLACK_CLIENT_SECRET=取得したClient Secret
GEMINI_API_KEY=あなたのGemini APIキー
FRONTEND_URL=https://YOUR_NGROK_URL
```

**注意**: ngrokを再起動するたびにURLが変わります。その都度：
1. `.env` の `FRONTEND_URL` を更新
2. Slack Appの「Redirect URLs」を更新

---

## 4. バックエンドの起動

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

---

## 5. 動作確認

1. ブラウザで `https://YOUR_NGROK_URL/auth/slack` にアクセス
2. Slackの認証画面で「許可」をクリック
3. 認証完了（404が出ても正常、DBにトークンが保存される）

### テストスクリプトで確認

```bash
python tests/verify_slack.py
```

---

## トラブルシューティング

| エラー | 原因 | 対処法 |
|--------|------|--------|
| `client_id` missing | `.env` が読み込まれていない | `config.py` のパス確認 |
| `access_denied` | スコープ不足またはBot未設定 | Slack App設定を確認 |
| `redirect_uri_mismatch` | URL不一致 | ngrok URLとSlack設定を一致させる |

---

## 補足：チーム開発時の注意

- **ngrok URL**: 各開発者で異なるため、共有できない
- **Slack App**: 開発用に個人でAppを作るか、共有Appを使う場合はRedirect URLを毎回更新する必要がある
- **Credentials**: `.env` はGit管理外。各自で設定が必要
