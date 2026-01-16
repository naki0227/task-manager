"use client";

import { motion } from "framer-motion";

export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
            className={`bg-muted rounded-lg ${className}`}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="card space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
        </div>
    );
}

export function TaskSkeleton() {
    return (
        <div className="card flex gap-4">
            <Skeleton className="w-1 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="max-w-6xl space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <TaskSkeleton />
                    <TaskSkeleton />
                    <TaskSkeleton />
                </div>
                <div className="space-y-4">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        </div>
    );
}
