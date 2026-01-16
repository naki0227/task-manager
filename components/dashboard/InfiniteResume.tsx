"use client";

import { motion } from "framer-motion";
import { History, Play, Clock, Monitor, FileText, Globe } from "lucide-react";

interface ContextSnapshot {
    id: number;
    name: string;
    timestamp: string;
    windows: { type: "code" | "browser" | "docs"; name: string }[];
    notes: string;
}

const MOCK_SNAPSHOTS: ContextSnapshot[] = [
    {
        id: 1,
        name: "API実装作業",
        timestamp: "2時間前",
        windows: [
            { type: "code", name: "VS Code - client.ts" },
            { type: "browser", name: "React Query Docs" },
            { type: "docs", name: "設計メモ.md" },
        ],
        notes: "fetcherの実装途中。エラーハンドリングを追加する予定。",
    },
    {
        id: 2,
        name: "デザインレビュー",
        timestamp: "昨日",
        windows: [
            { type: "browser", name: "Figma - Vision UI" },
            { type: "code", name: "VS Code - globals.css" },
        ],
        notes: "カラーパレットの調整。ダークモードのコントラストを確認。",
    },
    {
        id: 3,
        name: "ドキュメント作成",
        timestamp: "3日前",
        windows: [
            { type: "docs", name: "README.md" },
            { type: "browser", name: "GitHub - Vision Repo" },
        ],
        notes: "セットアップ手順を追記中。",
    },
];

const WINDOW_ICONS = {
    code: Monitor,
    browser: Globe,
    docs: FileText,
};

export function InfiniteResume() {
    const handleResume = (snapshotId: number) => {
        // In real implementation, this would call the Python backend
        console.log("Resuming snapshot:", snapshotId);
    };

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Infinite Resume</h3>
                </div>
                <span className="text-xs text-muted-foreground">{MOCK_SNAPSHOTS.length} 件のスナップショット</span>
            </div>

            {/* Snapshots */}
            <div className="space-y-3">
                {MOCK_SNAPSHOTS.map((snapshot, index) => (
                    <motion.div
                        key={snapshot.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
                    >
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-medium">{snapshot.name}</h4>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {snapshot.timestamp}
                                </p>
                            </div>
                            <button
                                onClick={() => handleResume(snapshot.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Play className="w-3 h-3" />
                                再開
                            </button>
                        </div>

                        {/* Windows */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {snapshot.windows.map((window, idx) => {
                                const Icon = WINDOW_ICONS[window.type];
                                return (
                                    <span
                                        key={idx}
                                        className="flex items-center gap-1.5 px-2 py-1 bg-card rounded text-xs"
                                    >
                                        <Icon className="w-3 h-3 text-muted-foreground" />
                                        {window.name}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Notes */}
                        <p className="text-xs text-muted-foreground italic">📝 {snapshot.notes}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
