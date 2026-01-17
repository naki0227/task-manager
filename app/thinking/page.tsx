"use client";

import { DreamToSteps } from "@/components/dashboard/DreamToSteps";
import { Target } from "lucide-react";

export default function ThinkingPage() {
    return (
        <div className="max-w-4xl">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary font-medium">目標達成サポート</span>
                </div>
                <h1 className="text-3xl font-bold">夢の計画</h1>
                <p className="text-muted-foreground mt-1">あなたの夢を具体的なステップに分解します</p>
            </header>

            {/* Dream to Steps */}
            <DreamToSteps />
        </div>
    );
}
