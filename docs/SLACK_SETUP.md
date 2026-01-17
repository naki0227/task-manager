# Slack連携セットアップガイド

このガイドでは、VisionタスクマネージャーをSlackと連携させるための詳細な手順を説明します。

## 1. Slack Appの作成（Manifestを使用）

Slack Appの設定は複雑ですが、「App Manifest」機能を使うことで、設定をコピー＆ペーストするだけで完了します。

1. [Slack API Apps](https://api.slack.com/apps) にアクセスします。
2. **"Create New App"** をクリックします。
3. **"From an app manifest"** を選択します。
4. インストール先のワークスペースを選択して **"Next"** をクリックします。
5. **"YAML"** タブを選択し、以下のコードをすべてコピーして貼り付けます。

```yaml
display_information:
  name: Vision Task Manager
  description: AI-powered task management from Slack
  background_color: "#2c2d30"
features:
  bot_user:
    display_name: Vision Bot
    always_online: true
oauth_config:
  scopes:
    bot:
      - channels:history
      - channels:read
      - chat:write
      - users:read
      - users:read.email
  redirect_urls:
    - https://YOUR_NGROK_URL.ngrok-free.app/auth/slack/callback
    - http://localhost:3000/auth/slack/callback
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

6. **重要**: 上記YAML内の `https://YOUR_NGROK_URL.ngrok-free.app` の部分は、後述するngrokの手順で取得したURLに書き換える必要があります。今の段階ではそのままでも作成できますが、OAuth認証を行う前に必ず修正が必要です。
7. **"Next"** をクリックし、内容を確認して **"Create"** をクリックします。
8. アプリが作成されたら、左メニューの **"Install App"** から **"Install to Workspace"** を行い、表示される **Bot User OAuth Token** は不要ですが、**Basic Information** > **App Credentials** にある **Client ID** と **Client Secret** をメモしてください。

## 2. ngrokのセットアップ

SlackのOAuth認証（ログイン）をローカル開発環境で動作させるには、`http://localhost:8000` を外部からアクセス可能なURL（HTTPS）にする必要があります。

1. [ngrok](https://ngrok.com/) をインストールし、アカウント登録を行います。
2. ターミナルで以下のコマンドを実行し、バックエンドサーバー（ポート8000）を公開します。

   ```bash
   ngrok http 8000
   ```

3. 画面に `Forwarding https://xxxx-xxxx.ngrok-free.app -> http://localhost:8000` のようなURLが表示されます。この `https://xxxx-xxxx.ngrok-free.app` の部分をコピーします。

4. [Slack API Apps](https://api.slack.com/apps) に戻り、作成したアプリを選択します。
5. 左メニューの **"App Manifest"** を開き、YAML内の `redirect_urls` を、ngrokで発行されたURLに合わせて修正します。

   ```yaml
   redirect_urls:
     - https://xxxx-xxxx.ngrok-free.app/auth/slack/callback
     - http://localhost:3000/auth/slack/callback
   ```
   ※ `xxxx-xxxx` の部分は毎回変わる可能性があります（有料版ngrok以外）。ngrokを再起動した場合は設定し直してください。

6. **"Save Changes"** をクリックします。

## 3. 環境変数の設定

1. プロジェクトの `.env` ファイルを開きます（無ければ `.env.example` をコピーして作成）。
2. 手順1でメモした **Client ID** と **Client Secret** を設定します。

```env
SLACK_CLIENT_ID=あなたのClient_ID
SLACK_CLIENT_SECRET=あなたのClient_Secret
```

3. フロントエンドの `.env` (もしあれば) または定数ファイルで、認証のリダイレクト先が正しく設定されているか確認してください。Visionタスクマネージャーでは、バックエンドがリダイレクト処理を行います。

## 4. 動作確認

1. バックエンドサーバーを起動します。
   ```bash
   uvicorn app.main:app --reload
   ```
2. フロントエンドから「Slack連携」ボタンをクリックします。
3. Slackの認証画面が表示され、「許可」をクリックすると、連携が完了します。
4. 連携後、Slackのパブリックチャンネルでの発言（「〜のタスクをお願い」など）が、タスクとして取り込まれるか確認してください。

以上でセットアップは完了です。
