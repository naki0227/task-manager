"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target, ChevronRight, ChevronLeft, Rocket, Zap } from "lucide-react";

interface OnboardingStep {
    id: number;
    title: string;
    description: string;
}

const STEPS: OnboardingStep[] = [
    { id: 1, title: "Visionへようこそ", description: "AIが準備、あとは始めるだけ。あなたの自律型ライフOSへ。" },
    { id: 2, title: "あなたの夢は？", description: "将来の目標を教えてください。AIが日々のステップに分解します。" },
    { id: 3, title: "時間価値を設定", description: "1時間あたりの価値を設定して、機会損失を可視化します。" },
    { id: 4, title: "準備完了！", description: "さあ、AIがあなたのために準備を始めます。" },
];

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [dream, setDream] = useState("");
    const [hourlyRate, setHourlyRate] = useState(3000);

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Save settings
            localStorage.setItem("vision-onboarding-complete", "true");
            localStorage.setItem("vision-dream", dream);
            localStorage.setItem("vision-preferences", JSON.stringify({ hourlyRate }));
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg mx-4"
            >
                <div className="card border-primary/20">
                    {/* Progress */}
                    <div className="flex gap-2 mb-6">
                        {STEPS.map((step) => (
                            <div
                                key={step.id}
                                className={`h-1 flex-1 rounded-full transition-colors ${step.id <= currentStep ? "bg-primary" : "bg-muted"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="min-h-[200px]"
                        >
                            {currentStep === 1 && (
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <Zap className="w-8 h-8 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">{STEPS[0].title}</h2>
                                    <p className="text-muted-foreground">{STEPS[0].description}</p>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target className="w-6 h-6 text-primary" />
                                        <h2 className="text-xl font-bold">{STEPS[1].title}</h2>
                                    </div>
                                    <p className="text-muted-foreground mb-4">{STEPS[1].description}</p>
                                    <textarea
                                        value={dream}
                                        onChange={(e) => setDream(e.target.value)}
                                        placeholder="例: 世界で活躍するフルスタックエンジニアになる"
                                        className="w-full h-24 px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    />
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-6 h-6 text-primary" />
                                        <h2 className="text-xl font-bold">{STEPS[2].title}</h2>
                                    </div>
                                    <p className="text-muted-foreground mb-4">{STEPS[2].description}</p>
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold">¥</span>
                                        <input
                                            type="number"
                                            value={hourlyRate}
                                            onChange={(e) => setHourlyRate(Number(e.target.value))}
                                            className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                        <span className="text-muted-foreground">/時間</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        ※ 目安: 学生 ¥1,000〜2,000 / エンジニア ¥3,000〜5,000
                                    </p>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                                        <Rocket className="w-8 h-8 text-accent" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">{STEPS[3].title}</h2>
                                    <p className="text-muted-foreground mb-4">{STEPS[3].description}</p>
                                    {dream && (
                                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-left">
                                            <p className="text-sm text-muted-foreground mb-1">あなたの夢:</p>
                                            <p className="font-medium">{dream}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            戻る
                        </button>
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            {currentStep === STEPS.length ? "始める" : "次へ"}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
