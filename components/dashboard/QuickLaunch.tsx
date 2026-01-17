"use client";

import { Rocket, Terminal, Code, BookOpen, Briefcase } from "lucide-react";
import { visionAPI } from "@/lib/api";
import { useState, useEffect } from "react";

interface QuickLaunchItem {
    id: number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    gradient: string;
    actionId: string;
}

const QUICK_LAUNCHES: QuickLaunchItem[] = [
    {
        id: 1,
        label: "開発環境",
        icon: Terminal,
        description: "VS Code + ターミナル",
        gradient: "from-blue-500 to-cyan-500",
        actionId: "dev_env"
    },
    {
        id: 2,
        label: "コードレビュー",
        icon: Code,
        description: "GitHub PR を開く",
        gradient: "from-purple-500 to-pink-500",
        actionId: "review"
    },
    {
        id: 3,
        label: "学習セッション",
        icon: BookOpen,
        description: "ドキュメント + ノート",
        gradient: "from-green-500 to-emerald-500",
        actionId: "learning"
    },
    {
        id: 4,
        label: "MTG準備",
        icon: Briefcase,
        description: "アジェンダ + Zoom",
        gradient: "from-orange-500 to-amber-500",
        actionId: "meeting"
    },
];

export function QuickLaunch() {
    const [launching, setLaunching] = useState<string | null>(null);
    const [isCloud, setIsCloud] = useState(false);

    useEffect(() => {
        visionAPI.getSystemConfig().then(c => setIsCloud(c.is_cloud_env)).catch(() => { });
    }, []);

    const handleLaunch = async (actionId: string) => {
        if (launching || isCloud) return;
        setLaunching(actionId);
        try {
            await visionAPI.launchAction(actionId);
        } catch (e) {
            console.error("Launch failed", e);
        } finally {
            setTimeout(() => setLaunching(null), 1000);
        }
    };

    return (
        <div className="card relative">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Rocket className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Quick Launch</h3>
            </div>

            {/* Launch Grid */}
            <div className={`grid grid-cols-2 gap-2 ${isCloud ? 'opacity-50 pointer-events-none' : ''}`}>
                {QUICK_LAUNCHES.map((item) => {
                    const Icon = item.icon;
                    const isLaunching = launching === item.actionId;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleLaunch(item.actionId)}
                            disabled={!!launching || isCloud}
                            className={`p-3 rounded-xl bg-muted hover:bg-muted/70 transition-all text-left group relative overflow-hidden ${isLaunching ? 'scale-95 opacity-80' : ''}`}
                        >
                            {isLaunching && (
                                <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                            )}
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                        </button>
                    );
                })}
            </div>

            {isCloud && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pt-8">
                    <span className="text-xs font-semibold bg-background/90 px-3 py-1.5 rounded-full shadow-sm text-muted-foreground border">
                        デスクトップ版のみ対応
                    </span>
                </div>
            )}
        </div>
    );
}
