"use client";

import { SkillTreeRPG } from "@/components/visuals/SkillTreeRPG";
import { Trophy, TrendingUp } from "lucide-react";

export default function SkillsPage() {
    return (
        <div className="max-w-5xl">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary font-medium">成長記録</span>
                </div>
                <h1 className="text-3xl font-bold">スキルツリー</h1>
                <p className="text-muted-foreground mt-1">あなたの成長をRPG風に可視化</p>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="card text-center">
                    <p className="text-3xl font-bold gradient-text">540</p>
                    <p className="text-sm text-muted-foreground mt-1">合計EXP</p>
                </div>
                <div className="card text-center">
                    <p className="text-3xl font-bold text-accent">8</p>
                    <p className="text-sm text-muted-foreground mt-1">習得スキル</p>
                </div>
                <div className="card text-center flex flex-col items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary mb-1" />
                    <p className="text-sm text-muted-foreground">成長中</p>
                </div>
            </div>

            {/* Skill Tree */}
            <SkillTreeRPG />
        </div>
    );
}
