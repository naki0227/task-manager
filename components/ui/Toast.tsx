"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

const TOAST_ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
};

const TOAST_STYLES = {
    success: "bg-accent/10 border-accent/30 text-accent",
    error: "bg-destructive/10 border-destructive/30 text-destructive",
    info: "bg-primary/10 border-primary/30 text-primary",
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const Icon = TOAST_ICONS[toast.type];
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm ${TOAST_STYLES[toast.type]}`}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-medium">{toast.message}</span>
                                <button
                                    onClick={() => dismissToast(toast.id)}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
