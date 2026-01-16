"use client";

import { FlowSynergy } from "@/components/visuals/FlowSynergy";
import { DreamToSteps } from "@/components/dashboard/DreamToSteps";
import { Brain } from "lucide-react";

export default function ThinkingPage() {
    return (
        <div className="max-w-6xl">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary font-medium">思考サポート</span>
                </div>
                <h1 className="text-3xl font-bold">思考ノード</h1>
                <p className="text-muted-foreground mt-1">あなたの思考をグラフ化し、目標を分解します</p>
            </header>

            {/* Content */}
            <div className="grid gap-6">
                {/* Flow Synergy */}
                <FlowSynergy />

                {/* Dream to Steps */}
                <DreamToSteps />
            </div>
        </div>
    );
}
