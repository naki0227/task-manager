"use client";

import { TrendingDown, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface LossData {
    hourlyRate: number;  // 1時間あたりの価値（円）
    idleMinutes: number; // 放置時間（分）
}

export function LossAversion({ hourlyRate = 3000, initialIdleMinutes = 45 }: { hourlyRate?: number; initialIdleMinutes?: number }) {
    const [idleMinutes, setIdleMinutes] = useState(initialIdleMinutes);
    const [isAnimating, setIsAnimating] = useState(false);

    // Simulate real-time loss accumulation
    useEffect(() => {
        const interval = setInterval(() => {
            setIdleMinutes(prev => prev + 1);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 300);
        }, 60000); // Every minute
        return () => clearInterval(interval);
    }, []);

    const lossAmount = Math.round((hourlyRate / 60) * idleMinutes);
    const hours = Math.floor(idleMinutes / 60);
    const minutes = idleMinutes % 60;

    return (
        <div className="card border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <h3 className="font-semibold text-destructive">機会損失</h3>
                </div>
                <span className="text-xs text-muted-foreground">リアルタイム計算中</span>
            </div>

            {/* Loss Amount */}
            <div className="text-center py-4">
                <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="w-6 h-6 text-destructive/70" />
                    <span className={`text-4xl font-bold text-destructive transition-transform ${isAnimating ? "scale-110" : ""}`}>
                        ¥{lossAmount.toLocaleString()}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    放置により失った可能性のある価値
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">
                            {hours > 0 ? `${hours}時間` : ""}{minutes}分
                        </p>
                        <p className="text-xs text-muted-foreground">放置時間</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <div>
                        <p className="text-sm font-medium">¥{hourlyRate.toLocaleString()}/h</p>
                        <p className="text-xs text-muted-foreground">時間価値</p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <button className="w-full mt-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                今すぐ作業を始める
            </button>
        </div>
    );
}
