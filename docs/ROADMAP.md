# DreamCatcher - Future Roadmap

現在（Web版/Cloud環境）では技術的制約により実装困難な機能や、将来的な拡張計画をここに記録します。

## 🚀 1. Desktop Application (Electron / Tauri)
**Issue**: Webブラウザ上の制約により、以下の機能がクラウド環境（Vercel/Render）で利用できない。
- **Quick Launch**: ローカルアプリの起動 (`open -a ...`)
- **Context Resume**: VS Codeの特定のワークスペースを開く、ターミナルの状態復元

**Solution**:
WebアプリをElectronまたはTauriでラップし、ローカルAPIへのアクセス権を持つネイティブアプリとして配布する。
これにより、バックエンドがローカルで動作しなくても、クライアントサイドからシステムコマンドを発行できる（またはローカルエージェントと通信する）アーキテクチャへ移行する。

---

## 📱 2. Mobile Native App (React Native)
**Issue**: PWAでは通知の信頼性が低く、ホーム画面ウィジェットなどのOSネイティブ機能が利用できない。
**Goal**:
- **iOS/Android App**: Push通知によるリマインダー、Focus TimerのLive Activity（iOS）、ホーム画面でのタスク確認。
- **Shared Backend**: 既存のRenderバックエンドとAPIを共有。

---

## 🧩 3. VS Code Extension Integration
**Issue**: 現在の「スキル分析」はGitHubコミット履歴に依存しており、リアルタイムのコーディング活動（どのファイルをどれくらい編集しているか）までは把握できない。
**Goal**:
- 専用のVS Code拡張機能を作成し、DreamCatcherサーバーへアクティビティを送信する。
- 「今、このタスクのコードを書いている」状態を自動検知し、Focus Timerと連動させる。

---

## 🤖 4. Autonomous Agents (Advanced)
**Issue**: 現在のGemini連携は「ユーザーの指示待ち」または「受動的な分析」が主。
**Goal**:
- **Active Agents**:
    - Gmailに来た日程調整メールに対し、カレンダーの空き状況を確認して返信案を自動作成（ユーザー承認待ち状態にする）。
    - Slackの未読が溜まったら要約して「緊急度」を判定し、プッシュ通知する。
    - 期限切れタスクに対し、自動でリスケジュール提案を行う。

---

## 🔄 5. Offline-First & Privacy Architecture
**Issue**: サーバー通信が必要なため、完全オフラインでの利用が不可。また、セキュリティ意識の高いユーザー（企業利用など）はクラウドへのデータ送信を懸念する。
**Solution**:
- **Local-First Sync**: RxDBやElectricSQLを導入し、データの実体をクライアント（ローカル）に持つ。
- **On-Device AI**: Gemini Nano や Llama などのローカルLLMを活用し、プライバシーデータを外部送信せずに「分析」や「要約」を実行するオプションを提供する。

---

## ⚡️ 6. Technical Performance & UX (Deep Polish)
**Issue**: LLMの待機時間やチャットUIの入力コストが、「サクサク操作したい」ユーザーの体験を損なう懸念がある。
**Solution**:
- **Optimistic UI**: バックエンドの応答を待たず、フロントエンドで即座に「仮のタスク」を表示。バックグラウンドで整合性を取ることで体感レイテンシをゼロにする。
- **Vector RAG**: スキル分析をキーワードマッチングからベクトル検索（Vector Database）へ移行し、過去の膨大なコード資産から「文脈」を高度に検索可能にする。
- **Human-in-the-Loop UI**: AIのエージェント動作（削除、変更）に対し、ユーザーが直感的に「Approve/Reject」できる安全装置UIを標準化する。

