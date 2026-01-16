"use client";

import { CheckCircle2, Circle, TrendingUp, Target } from "lucide-react";

export function ProgressCard() {
    const completedTasks = 5;
    const totalTasks = 8;
    const progressPercent = Math.round((completedTasks / totalTasks) * 100);

    return (
        <div className="card card-hover">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">今日の進捗</h2>
                        <p className="text-sm text-muted-foreground">{completedTasks}/{totalTasks} タスク完了</p>
                    </div>
                </div>
                <span className="text-2xl font-bold gradient-text">{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
                <div
                    className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <CheckCircle2 className="w-5 h-5 text-accent mx-auto mb-2" />
                    <p className="text-xl font-bold">{completedTasks}</p>
                    <p className="text-xs text-muted-foreground">完了</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <Circle className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xl font-bold">{totalTasks - completedTasks}</p>
                    <p className="text-xs text-muted-foreground">残り</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <TrendingUp className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-xl font-bold">+12%</p>
                    <p className="text-xs text-muted-foreground">昨日比</p>
                </div>
            </div>
        </div>
    );
}
