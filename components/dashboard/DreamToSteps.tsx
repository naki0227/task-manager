"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target, ChevronRight, Loader2 } from "lucide-react";
import { visionAPI, DreamStep } from "@/lib/api";



const MOCK_STEPS: DreamStep[] = [
    { id: 1, title: "プログラミング基礎を固める", duration: "2ヶ月", status: "completed" },
    { id: 2, title: "Reactをマスターする", duration: "3ヶ月", status: "active" },
    { id: 3, title: "バックエンド開発を学ぶ", duration: "2ヶ月", status: "pending" },
    { id: 4, title: "個人プロジェクトを完成させる", duration: "1ヶ月", status: "pending" },
    { id: 5, title: "ポートフォリオを作成する", duration: "2週間", status: "pending" },
];

export function DreamToSteps() {
    const [dream, setDream] = useState("フルスタックエンジニアになる");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [steps, setSteps] = useState<DreamStep[]>(MOCK_STEPS);
    const [showSteps, setShowSteps] = useState(true);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setShowSteps(false);

        try {
            const result = await visionAPI.analyzeDream(dream);
            setSteps(result);
            setShowSteps(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Dream → Steps</h3>
                <span className="text-xs text-muted-foreground">夢から逆算</span>
            </div>

            {/* Dream Input */}
            <div className="mb-6">
                <label className="text-sm text-muted-foreground mb-2 block">あなたの夢・目標</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={dream}
                        onChange={(e) => setDream(e.target.value)}
                        placeholder="例: 世界で活躍するエンジニアになる"
                        className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                分析中
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                分解
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Steps Timeline */}
            <AnimatePresence mode="wait">
                {showSteps && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative"
                    >
                        {/* Timeline Line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                        {/* Steps */}
                        <div className="space-y-4">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-4 relative"
                                >
                                    {/* Timeline Dot */}
                                    <div
                                        className={`
                      w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0
                      ${step.status === "completed" ? "bg-accent text-white" :
                                                step.status === "active" ? "bg-primary text-white animate-pulse" :
                                                    "bg-muted text-muted-foreground"}
                    `}
                                    >
                                        {step.status === "completed" ? "✓" : index + 1}
                                    </div>

                                    {/* Content */}
                                    <div className={`flex-1 p-3 rounded-lg ${step.status === "active" ? "bg-primary/10 border border-primary/20" : "bg-muted/50"}`}>
                                        <div className="flex items-center justify-between">
                                            <p className={`font-medium ${step.status === "pending" ? "text-muted-foreground" : ""}`}>
                                                {step.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground">{step.duration}</span>
                                        </div>
                                        {step.status === "active" && (
                                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                                <ChevronRight className="w-3 h-3" />
                                                現在進行中
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
