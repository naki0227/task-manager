"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, AlertTriangle } from "lucide-react";

interface LossTickerProps {
    hourlyRate?: number;
    initialLoss?: number;
}

export function LossTicker({ hourlyRate = 5000, initialLoss = 1250 }: LossTickerProps) {
    const [loss, setLoss] = useState(initialLoss);

    // Simulate increasing loss
    useEffect(() => {
        const interval = setInterval(() => {
            setLoss(prev => prev + (hourlyRate / 3600));
        }, 1000);
        return () => clearInterval(interval);
    }, [hourlyRate]);

    return (
        <div className="relative overflow-hidden rounded-lg border border-red-500/20 bg-red-950/10 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-500">
                    <TrendingDown className="h-5 w-5" />
                    <h3 className="font-mono text-sm font-bold tracking-wider">LOSS_AVERSION</h3>
                </div>
                <div className="flex items-center gap-1 text-xs text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span>LIVE</span>
                </div>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-red-500">¥</span>
                <div className="font-mono text-4xl font-bold tracking-tighter text-white">
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={Math.floor(loss)}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {Math.floor(loss).toLocaleString()}
                        </motion.span>
                    </AnimatePresence>
                </div>
                <span className="font-mono text-sm text-red-400">.{(loss % 1).toFixed(2).substring(2)}</span>
            </div>

            <div className="mt-2 text-xs text-red-400/60 font-mono">
                Opportunity Cost accumulating at ¥{hourlyRate}/hr
            </div>

            {/* Background Pulse */}
            <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow pointer-events-none" />
        </div>
    );
}
