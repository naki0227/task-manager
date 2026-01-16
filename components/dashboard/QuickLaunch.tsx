"use client";

import { Rocket, Terminal, Code, BookOpen, Briefcase } from "lucide-react";

interface QuickLaunchItem {
    id: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    gradient: string;
}

const QUICK_LAUNCHES: QuickLaunchItem[] = [
    {
        id: 1,
        label: "開発環境",
        icon: Terminal,
        description: "VS Code + ターミナル",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        id: 2,
        label: "コードレビュー",
        icon: Code,
        description: "GitHub PR を開く",
        gradient: "from-purple-500 to-pink-500",
    },
    {
        id: 3,
        label: "学習セッション",
        icon: BookOpen,
        description: "ドキュメント + ノート",
        gradient: "from-green-500 to-emerald-500",
    },
    {
        id: 4,
        label: "MTG準備",
        icon: Briefcase,
        description: "アジェンダ + Zoom",
        gradient: "from-orange-500 to-amber-500",
    },
];

export function QuickLaunch() {
    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Rocket className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Quick Launch</h3>
            </div>

            {/* Launch Grid */}
            <div className="grid grid-cols-2 gap-2">
                {QUICK_LAUNCHES.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className="p-3 rounded-xl bg-muted hover:bg-muted/70 transition-colors text-left group"
                        >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
