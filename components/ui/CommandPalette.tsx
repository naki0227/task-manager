"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, X, FileText, FolderKanban, Trophy, Settings } from "lucide-react";

interface SearchResult {
    type: "page" | "project" | "skill" | "action";
    title: string;
    description?: string;
    href?: string;
    action?: () => void;
}

const SEARCH_RESULTS: SearchResult[] = [
    { type: "page", title: "ダッシュボード", href: "/" },
    { type: "page", title: "夢の計画", href: "/thinking" },
    { type: "page", title: "スキルツリー", href: "/skills" },
    { type: "page", title: "コンテキスト", href: "/resume" },
    { type: "page", title: "設定", href: "/settings" },
    { type: "project", title: "Vision Frontend", description: "進捗 65%" },
    { type: "project", title: "Backend API", description: "進捗 40%" },
    { type: "skill", title: "React / Next.js", description: "Lv.2 - 60 EXP" },
    { type: "skill", title: "TypeScript", description: "Lv.2 - 60 EXP" },
    { type: "action", title: "新しいタスクを作成", action: () => console.log("Create task") },
    { type: "action", title: "コンテキストを保存", action: () => console.log("Save context") },
];

const TYPE_ICONS = {
    page: FileText,
    project: FolderKanban,
    skill: Trophy,
    action: Settings,
};

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");

    // Filter results based on query
    const filteredResults = query
        ? SEARCH_RESULTS.filter(r =>
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.description?.toLowerCase().includes(query.toLowerCase())
        )
        : SEARCH_RESULTS.slice(0, 6);

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSelect = useCallback((result: SearchResult) => {
        if (result.href) {
            window.location.href = result.href;
        } else if (result.action) {
            result.action();
        }
        setIsOpen(false);
        setQuery("");
    }, []);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 lg:bottom-auto lg:top-4 lg:right-4 z-30 flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
                <Search className="w-4 h-4" />
                <span className="hidden lg:inline text-sm">検索</span>
                <kbd className="hidden lg:flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                    <Command className="w-3 h-3" />K
                </kbd>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
                        />

                        {/* Palette */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-lg mx-4"
                        >
                            <div className="card border-primary/20 overflow-hidden">
                                {/* Search Input */}
                                <div className="flex items-center gap-3 p-4 border-b border-border">
                                    <Search className="w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="ページ、プロジェクト、スキルを検索..."
                                        autoFocus
                                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                                    />
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-muted rounded transition-colors"
                                    >
                                        <X className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>

                                {/* Results */}
                                <div className="max-h-80 overflow-y-auto p-2">
                                    {filteredResults.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            結果が見つかりません
                                        </p>
                                    ) : (
                                        <div className="space-y-1">
                                            {filteredResults.map((result, index) => {
                                                const Icon = TYPE_ICONS[result.type];
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSelect(result)}
                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                                                    >
                                                        <Icon className="w-4 h-4 text-muted-foreground" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{result.title}</p>
                                                            {result.description && (
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {result.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
                                    <span>↑↓ で移動</span>
                                    <span>Enter で選択</span>
                                    <span>Esc で閉じる</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
