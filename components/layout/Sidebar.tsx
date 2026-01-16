"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    Brain,
    History,
    Trophy,
    Settings,
    Flame,
    Zap,
    Menu,
    X,
    BarChart3,
    Calendar,
    MessageCircle,
    Timer
} from "lucide-react";
import { useState } from "react";
import { FocusTimer } from "@/components/dashboard/FocusTimer";

const NAV_ITEMS = [
    { label: "ダッシュボード", href: "/", icon: Home },
    { label: "統計", href: "/stats", icon: BarChart3 },
    { label: "カレンダー", href: "/calendar", icon: Calendar },
    { label: "思考ノード", href: "/thinking", icon: Brain },
    { label: "コンテキスト", href: "/resume", icon: History },
    { label: "スキル", href: "/skills", icon: Trophy },
    { label: "チャット", href: "/chat", icon: MessageCircle },
    { label: "設定", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [showTimer, setShowTimer] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg lg:hidden"
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 h-screen w-[260px] bg-card border-r border-border flex flex-col z-40 transition-transform duration-300",
                "lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo */}
                <div className="p-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold gradient-text">Vision</h1>
                            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Autonomous OS</p>
                        </div>
                    </div>
                </div>

                {/* Focus Timer Toggle */}
                <div className="px-3 mb-2">
                    <button
                        onClick={() => setShowTimer(!showTimer)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                        <Timer className="w-4 h-4" />
                        Focus Timer
                    </button>
                </div>

                {/* Focus Timer Panel */}
                {showTimer && (
                    <div className="px-3 mb-4">
                        <FocusTimer />
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 overflow-y-auto">
                    <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        メニュー
                    </p>
                    <ul className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                            isActive
                                                ? "bg-primary/10 text-primary border border-primary/20"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Keyboard Shortcuts Hint */}
                <div className="px-6 py-2 text-[10px] text-muted-foreground">
                    <kbd className="px-1 bg-muted rounded">g</kbd>+<kbd className="px-1 bg-muted rounded">d</kbd> ダッシュボード
                </div>

                {/* Streak Counter */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
                        <Flame className="w-6 h-6 text-orange-500" />
                        <div>
                            <p className="text-sm font-bold text-orange-400">7日連続</p>
                            <p className="text-xs text-muted-foreground">継続中！</p>
                        </div>
                    </div>
                </div>

                {/* User */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            U
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">User</p>
                            <p className="text-xs text-muted-foreground">Free Plan</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
