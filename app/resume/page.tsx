"use client";

import { InfiniteResume } from "@/components/dashboard/InfiniteResume";
import { History, Plus } from "lucide-react";

export default function ResumePage() {
    return (
        <div className="max-w-4xl">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <History className="w-5 h-5 text-primary" />
                        <span className="text-sm text-primary font-medium">コンテキスト保存</span>
                    </div>
                    <h1 className="text-3xl font-bold">Infinite Resume</h1>
                    <p className="text-muted-foreground mt-1">ボタン一つで、作業環境を完全に復元</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" />
                    今の状態を保存
                </button>
            </header>

            {/* Content */}
            <InfiniteResume />
        </div>
    );
}
