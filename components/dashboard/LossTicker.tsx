"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LossTicker({ hourlyRate = 5000, initialLoss = 1250 }) {
    const [loss, setLoss] = useState(initialLoss);

    useEffect(() => {
        const interval = setInterval(() => {
            setLoss(prev => prev + (hourlyRate / 3600));
        }, 1000);
        return () => clearInterval(interval);
    }, [hourlyRate]);

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h3 className="font-heading text-4xl text-foreground mb-1">Opportunity Loss</h3>
            <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-6 opacity-60">
                Estimated Cost of Inaction
            </p>

            <div className="flex items-start justify-center gap-2 font-heading text-primary leading-none">
                <span className="text-2xl mt-4 opacity-50">¥</span>
                <div className="text-8xl tracking-tighter tabular-nums drop-shadow-sm">
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={Math.floor(loss)}
                            initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                            exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.3 }}
                            className="inline-block"
                        >
                            {Math.floor(loss).toLocaleString()}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-4 px-4 py-1 rounded-full border border-primary/20 bg-primary/5">
                <span className="text-xs font-mono font-medium text-primary tracking-widest">
                    RATE: ¥{hourlyRate.toLocaleString()}/HR
                </span>
            </div>
        </div>
    );
}
