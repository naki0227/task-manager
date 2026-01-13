"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Network, TrendingDown, Zap, Settings, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Network, label: "Flow Synergy", href: "/flow" },
    { icon: TrendingDown, label: "Loss Aversion", href: "/loss" },
    { icon: Zap, label: "Skills", href: "/skills" },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            className={cn(
                "fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-white/10 bg-background/50 backdrop-blur-md transition-all duration-300",
                isExpanded ? "w-64" : "w-16"
            )}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <div className="flex h-16 items-center justify-center border-b border-white/10">
                <Menu className="h-6 w-6 text-primary" />
                {isExpanded && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-3 font-mono font-bold tracking-wider text-primary"
                    >
                        VISION_OS
                    </motion.span>
                )}
            </div>

            <nav className="flex-1 space-y-2 p-3 mt-4">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-md p-2 transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-[0_0_10px_rgba(0,243,255,0.2)] border border-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="ml-3 text-sm font-medium"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-white/10">
                <button className="flex w-full items-center rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-white">
                    <Settings className="h-5 w-5" />
                    {isExpanded && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3 text-sm font-medium"
                        >
                            System
                        </motion.span>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
