"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target, ChevronRight, ChevronDown, Loader2, ExternalLink, DollarSign, Trash2 } from "lucide-react";
import { useDream } from "@/contexts/DreamContext";

const DURATION_OPTIONS = [
    { value: "1ヶ月", label: "1ヶ月" },
    { value: "3ヶ月", label: "3ヶ月" },
    { value: "6ヶ月", label: "6ヶ月" },
    { value: "1年", label: "1年" },
    { value: "2年", label: "2年" },
];

export function DreamToSteps() {
    const {
        dream,
        setDream,
        targetDuration,
        setTargetDuration,
        steps,
        isAnalyzing,
        analyzeDream,
        updateStepStatus,
        clearDream
    } = useDream();

    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

    const toggleStep = (stepId: number) => {
        setExpandedSteps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(stepId)) {
                newSet.delete(stepId);
            } else {
                newSet.add(stepId);
            }
            return newSet;
        });
    };

    const handleAnalyze = async () => {
        if (!dream.trim()) return;
        setExpandedSteps(new Set());
        await analyzeDream();
        // Auto-expand first step after analysis
        if (steps.length > 0) {
            setExpandedSteps(new Set([steps[0].id]));
        }
    };

    const handleStepComplete = (stepId: number) => {
        updateStepStatus(stepId, "completed");
        // Activate next pending step
        const currentIndex = steps.findIndex(s => s.id === stepId);
        if (currentIndex < steps.length - 1) {
            updateStepStatus(steps[currentIndex + 1].id, "active");
        }
    };

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Dream → Steps</h3>
                    <span className="text-xs text-muted-foreground">夢から逆算</span>
                </div>
                {steps.length > 0 && (
                    <button
                        onClick={clearDream}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        title="夢をクリア"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        クリア
                    </button>
                )}
            </div>

            {/* Dream Input */}
            <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">あなたの夢・目標</label>
                <input
                    type="text"
                    value={dream}
                    onChange={(e) => setDream(e.target.value)}
                    placeholder="例: フルスタックエンジニアになる"
                    className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            {/* Duration Selector */}
            <div className="mb-6 flex items-center gap-4">
                <label className="text-sm text-muted-foreground">達成目標期間:</label>
                <select
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(e.target.value)}
                    className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    {DURATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !dream.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
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

            {/* Steps Timeline with Accordion */}
            <AnimatePresence mode="wait">
                {steps.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative"
                    >
                        {/* Timeline Line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                        {/* Steps */}
                        <div className="space-y-3">
                            {steps.map((step, index) => {
                                const isExpanded = expandedSteps.has(step.id);
                                const hasSubTasks = step.subTasks && step.subTasks.length > 0;

                                return (
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative"
                                    >
                                        {/* Main Step Row */}
                                        <div
                                            className={`flex items-start gap-4 cursor-pointer`}
                                            onClick={() => hasSubTasks && toggleStep(step.id)}
                                        >
                                            {/* Timeline Dot */}
                                            <div
                                                className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 cursor-pointer
                                                    ${step.status === "completed" ? "bg-accent text-white" :
                                                        step.status === "active" ? "bg-primary text-white animate-pulse" :
                                                            "bg-muted text-muted-foreground"}
                                                `}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (step.status !== "completed") {
                                                        handleStepComplete(step.id);
                                                    }
                                                }}
                                                title={step.status === "completed" ? "完了済み" : "クリックで完了"}
                                            >
                                                {step.status === "completed" ? "✓" : index + 1}
                                            </div>

                                            {/* Content */}
                                            <div className={`flex-1 p-3 rounded-lg ${step.status === "active" ? "bg-primary/10 border border-primary/20" : step.status === "completed" ? "bg-accent/10 border border-accent/20" : "bg-muted/50"}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {hasSubTasks && (
                                                            isExpanded ?
                                                                <ChevronDown className="w-4 h-4 text-muted-foreground" /> :
                                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                        <p className={`font-medium ${step.status === "pending" ? "text-muted-foreground" : step.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                                            {step.title}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{step.duration}</span>
                                                </div>
                                                {step.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                                                        {step.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded Sub-tasks */}
                                        <AnimatePresence>
                                            {isExpanded && hasSubTasks && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="ml-12 mt-2 space-y-2"
                                                >
                                                    {step.subTasks!.map((subTask, subIndex) => (
                                                        <div
                                                            key={subIndex}
                                                            className="p-3 bg-background border border-border rounded-lg"
                                                        >
                                                            <div className="flex items-start gap-2 mb-2">
                                                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                                    {subTask.week}
                                                                </span>
                                                                <p className="text-sm flex-1">{subTask.task}</p>
                                                            </div>

                                                            {/* Resources */}
                                                            <div className="space-y-1 ml-1">
                                                                {subTask.freeResource && (
                                                                    <div className="flex items-center gap-2 text-xs text-accent">
                                                                        <ExternalLink className="w-3 h-3" />
                                                                        <span className="font-medium">無料:</span>
                                                                        <span>{subTask.freeResource}</span>
                                                                    </div>
                                                                )}
                                                                {subTask.paidResource && (
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <DollarSign className="w-3 h-3" />
                                                                        <span className="font-medium">有料:</span>
                                                                        <span>{subTask.paidResource}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {steps.length === 0 && !isAnalyzing && (
                <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>夢を入力して「分解」をクリック</p>
                </div>
            )}
        </div>
    );
}
