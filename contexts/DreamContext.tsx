"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { DreamStep, visionAPI } from "@/lib/api";

const STORAGE_KEY = "vision-dream-data";

interface DreamData {
    dream: string;
    targetDuration: string;
    steps: DreamStep[];
}

interface DreamContextType {
    // State
    dream: string;
    targetDuration: string;
    steps: DreamStep[];
    isAnalyzing: boolean;
    error: string | null;

    // Actions
    setDream: (dream: string) => void;
    setTargetDuration: (duration: string) => void;
    analyzeDream: () => Promise<void>;
    updateStepStatus: (stepId: number, status: "pending" | "active" | "completed") => void;
    clearDream: () => void;
}

const DreamContext = createContext<DreamContextType | undefined>(undefined);

// Helper to safely access localStorage
const getStoredData = (): DreamData | null => {
    if (typeof window === "undefined") return null;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

const saveData = (data: DreamData) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Ignore storage errors
    }
};

const clearStoredData = () => {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Ignore
    }
};

export function DreamProvider({ children }: { children: ReactNode }) {
    const [dream, setDreamState] = useState("");
    const [targetDuration, setTargetDurationState] = useState("6ヶ月");
    const [steps, setSteps] = useState<DreamStep[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = getStoredData();
        if (stored) {
            setDreamState(stored.dream || "");
            setTargetDurationState(stored.targetDuration || "6ヶ月");
            setSteps(stored.steps || []);
        }
        setIsHydrated(true);
    }, []);

    // Save to localStorage on changes (after hydration)
    useEffect(() => {
        if (!isHydrated) return;
        saveData({ dream, targetDuration, steps });
    }, [dream, targetDuration, steps, isHydrated]);

    const setDream = useCallback((value: string) => {
        setDreamState(value);
    }, []);

    const setTargetDuration = useCallback((value: string) => {
        setTargetDurationState(value);
    }, []);

    const analyzeDream = useCallback(async () => {
        if (!dream.trim()) return;

        setIsAnalyzing(true);
        setError(null);
        setSteps([]);

        try {
            const result = await visionAPI.analyzeDream(dream, targetDuration);
            // Set first step as active
            const stepsWithActive = result.map((step, i) => ({
                ...step,
                status: i === 0 ? "active" as const : "pending" as const
            }));
            setSteps(stepsWithActive);
        } catch (e) {
            console.error(e);
            setError("分析に失敗しました");
        } finally {
            setIsAnalyzing(false);
        }
    }, [dream, targetDuration]);

    const updateStepStatus = useCallback((stepId: number, status: "pending" | "active" | "completed") => {
        setSteps(prev => prev.map(step =>
            step.id === stepId ? { ...step, status } : step
        ));
    }, []);

    const clearDream = useCallback(() => {
        setDreamState("");
        setSteps([]);
        setError(null);
        clearStoredData();
    }, []);

    return (
        <DreamContext.Provider value={{
            dream,
            targetDuration,
            steps,
            isAnalyzing,
            error,
            setDream,
            setTargetDuration,
            analyzeDream,
            updateStepStatus,
            clearDream,
        }}>
            {children}
        </DreamContext.Provider>
    );
}

export function useDream() {
    const context = useContext(DreamContext);
    if (context === undefined) {
        throw new Error("useDream must be used within a DreamProvider");
    }
    return context;
}
