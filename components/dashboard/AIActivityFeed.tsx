"use client";

import { Bot, FolderPlus, FileText, Search, Zap, Clock } from "lucide-react";

interface ActivityItem {
    id: number;
    type: "folder" | "file" | "summary" | "analysis";
    message: string;
    timestamp: string;
}

const MOCK_ACTIVITIES: ActivityItem[] = [
    { id: 1, type: "folder", message: "/projects/vision-api/ を作成しました", timestamp: "2分前" },
    { id: 2, type: "file", message: "client.ts のボイラープレートを生成しました", timestamp: "2分前" },
    { id: 3, type: "summary", message: "React Query v5 のドキュメントを要約しました", timestamp: "5分前" },
    { id: 4, type: "analysis", message: "GitHub の Issue #42 を分析しました", timestamp: "10分前" },
    { id: 5, type: "folder", message: "/docs/sprint-review/ を作成しました", timestamp: "15分前" },
    { id: 6, type: "file", message: "agenda.md を生成しました", timestamp: "15分前" },
];

const TYPE_ICONS = {
    folder: FolderPlus,
    file: FileText,
    summary: Search,
    analysis: Zap,
};

const TYPE_COLORS = {
    folder: "text-blue-400",
    file: "text-green-400",
    summary: "text-purple-400",
    analysis: "text-amber-400",
};

export function AIActivityFeed() {
    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">AI Activity</h3>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>

            {/* Activity List */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {MOCK_ACTIVITIES.map((activity) => {
                    const Icon = TYPE_ICONS[activity.type];
                    return (
                        <div key={activity.id} className="flex items-start gap-3 group">
                            <div className={`p-1.5 rounded-md bg-muted ${TYPE_COLORS[activity.type]}`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground/90 truncate">{activity.message}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {activity.timestamp}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* View All */}
            <button className="w-full mt-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors">
                すべての活動を見る →
            </button>
        </div>
    );
}
