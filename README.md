# Vision - Autonomous Life OS

> **「AIが準備、あとは始めるだけ」** - 意志を必要としない自律型ライフOS

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 コンセプト

従来のタスク管理は「やることリストを見て、自分で頑張る」。  
Visionは違います。**AIが勝手に準備を終わらせ、あとは実行するだけ**。

- 🚀 **Zero Start**: フォルダ作成、初期コード、資料要約をAIが自動実行
- 🧠 **Flow Synergy**: 思考をノードグラフ化、論理の飛躍を検知
- 💸 **Loss Aversion**: サボりの機会損失をリアルタイム可視化
- 🔄 **Infinite Resume**: ボタン一つで作業環境を完全復元
- 🎮 **Auto Skill Tree**: 成果物からRPG風スキルツリーを自動生成

## 🛠️ 技術スタック

- **Frontend**: Next.js 16, React, Tailwind CSS, Framer Motion, React Flow
- **Backend**: Python (FastAPI) - *別リポジトリ*
- **AI**: Gemini 2.5 Flash API

## 📦 セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-org/vision.git
cd vision

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

http://localhost:3000 でアプリが起動します。

## 📁 プロジェクト構成

```
vision/
├── app/                    # Next.js App Router
│   ├── page.tsx           # ダッシュボード
│   ├── thinking/          # 思考ノード (Flow Synergy)
│   ├── skills/            # スキルツリー
│   ├── resume/            # Infinite Resume
│   ├── projects/          # プロジェクト一覧
│   └── settings/          # 設定 (OAuth連携含む)
├── components/
│   ├── dashboard/         # ダッシュボードコンポーネント
│   ├── visuals/           # グラフ・ツリー可視化
│   ├── layout/            # レイアウト (Sidebar等)
│   ├── ui/                # 共通UI (Toast, Skeleton等)
│   └── onboarding/        # オンボーディング
├── lib/
│   ├── api.ts             # API クライアント (Python連携用)
│   ├── storage.ts         # ローカルストレージ
│   └── utils.ts           # ユーティリティ
└── public/
    └── manifest.json      # PWA設定
```

## 🔗 API連携 (Python チーム向け)

詳細は [BACKEND_SPEC.md](./docs/BACKEND_SPEC.md) を参照してください。

### エンドポイント一覧

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/prepared-tasks` | AI準備済みタスク一覧 |
| POST | `/api/prepared-tasks/:id/start` | タスク開始 |
| GET | `/api/ai-activities` | AI活動ログ |
| GET | `/api/snapshots` | コンテキストスナップショット |
| POST | `/api/snapshots/:id/resume` | 環境復元 |
| GET | `/api/skills` | スキルデータ |
| POST | `/api/dream/analyze` | 夢→ステップ分解 |

## ⌨️ キーボードショートカット

| ショートカット | 動作 |
|---------------|------|
| `Cmd/Ctrl + K` | グローバル検索 |
| `Esc` | モーダルを閉じる |

## 👥 チームメンバー

- **Frontend**: Vision UI 担当
- **Backend (Python)**: API / AI連携担当

## 📄 ライセンス

MIT
