"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Target, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

type TimerMode = "focus" | "break";

const FOCUS_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60; // 5 minutes

export function FocusTimer() {
    const { token } = useAuth();
    const [mode, setMode] = useState<TimerMode>("focus");
    const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
    const [isRunning, setIsRunning] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [sessions, setSessions] = useState(0);

    const recordSession = async () => {
        if (!token) return;
        try {
            await fetch("http://localhost:8000/api/stats/focus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ durationMinutes: 25 })
            });
        } catch (e) {
            console.error("Failed to record session", e);
        }
    };

    // Timer logic
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Timer finished
                    if (soundEnabled) {
                        // Play notification sound
                        const audio = new Audio("/notification.mp3");
                        audio.play().catch(() => { });
                    }

                    if (mode === "focus") {
                        setSessions((s) => s + 1);
                        recordSession(); // Record the session
                        setMode("break");
                        return BREAK_TIME;
                    } else {
                        setMode("focus");
                        return FOCUS_TIME;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, mode, soundEnabled, token]);

    const handleReset = useCallback(() => {
        setIsRunning(false);
        setTimeLeft(mode === "focus" ? FOCUS_TIME : BREAK_TIME);
    }, [mode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = mode === "focus"
        ? (FOCUS_TIME - timeLeft) / FOCUS_TIME
        : (BREAK_TIME - timeLeft) / BREAK_TIME;

    return (
        <div className="card text-center">
            {/* Mode Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
                {mode === "focus" ? (
                    <Target className="w-5 h-5 text-primary" />
                ) : (
                    <Coffee className="w-5 h-5 text-accent" />
                )}
                <span className={`font-semibold ${mode === "focus" ? "text-primary" : "text-accent"}`}>
                    {mode === "focus" ? "集中モード" : "休憩モード"}
                </span>
            </div>

            {/* Timer Display */}
            <div className="relative w-48 h-48 mx-auto mb-6">
                {/* Progress Ring */}
                <svg className="w-full h-full -rotate-90">
                    <circle
                        cx="96"
                        cy="96"
                        r="88"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                    />
                    <motion.circle
                        cx="96"
                        cy="96"
                        r="88"
                        fill="none"
                        stroke={mode === "focus" ? "#3ea8ff" : "#22c55e"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={553}
                        initial={{ strokeDashoffset: 553 }}
                        animate={{ strokeDashoffset: 553 * (1 - progress) }}
                        transition={{ duration: 0.5 }}
                    />
                </svg>

                {/* Time Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold font-mono">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
                <button
                    onClick={handleReset}
                    className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`p-4 rounded-full transition-colors ${isRunning
                        ? "bg-destructive text-white"
                        : "bg-primary text-white"
                        }`}
                >
                    {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
            </div>

            {/* Session Counter */}
            <p className="text-sm text-muted-foreground">
                本日のセッション: <span className="font-bold text-foreground">{sessions}</span>
            </p>
        </div>
    );
}
