"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Lock, CheckCircle, Zap, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface SkillNode {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    exp: number;
    unlocked: boolean;
}

interface TreeNode extends SkillNode {
    x: number;
    y: number;
    connections: string[];
}

const LEVEL_COLORS = [
    "from-gray-500 to-gray-600",
    "from-green-500 to-emerald-500",
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
];

// Skill dependency tree - defines relationships
const SKILL_DEPENDENCIES: Record<string, string[]> = {
    // Languages are roots
    "typescript": ["javascript"],
    "javascript": [],
    "python": [],
    "go": [],
    "rust": [],
    "swift": [],
    "dart": [],
    "java": [],
    "kotlin": ["java"],
    "c++": [],
    "c": [],
    "csharp": [],
    "ruby": [],
    "php": [],
    "scala": ["java"],
    "html": [],
    "css": ["html"],
    "sql": [],
    "shell": [],

    // Frameworks depend on languages
    "react": ["javascript", "typescript"],
    "nextjs": ["react"],
    "vue": ["javascript", "typescript"],
    "nuxt": ["vue"],
    "angular": ["typescript"],
    "svelte": ["javascript"],
    "solidjs": ["javascript"],
    "astro": ["javascript"],
    "remix": ["react"],
    "gatsby": ["react"],
    "fastapi": ["python"],
    "django": ["python"],
    "flask": ["python"],
    "express": ["javascript"],
    "nestjs": ["typescript"],
    "rails": ["ruby"],
    "laravel": ["php"],
    "spring": ["java"],
    "gin": ["go"],
    "echo": ["go"],
    "actix": ["rust"],
    "axum": ["rust"],
    "flutter": ["dart"],
    "swiftui": ["swift"],
    "reactnative": ["javascript", "typescript"],
    "jetpackcompose": ["kotlin"],

    // CSS/Styling
    "tailwindcss": ["css"],
    "sass": ["css"],
    "styledcomponents": ["css"],
    "chakraui": ["react"],
    "materialui": ["react"],

    // Tools
    "docker": [],
    "dockerfile": ["docker"],
    "kubernetes": ["docker"],
    "terraform": [],
    "postgresql": ["sql"],
    "mysql": ["sql"],
    "mongodb": [],
    "redis": [],
    "sqlite": ["sql"],
    "prisma": [],
    "supabase": ["postgresql"],
    "firebase": [],
    "graphql": [],
    "trpc": ["typescript"],

    // Testing
    "jest": ["javascript"],
    "vitest": ["javascript"],
    "pytest": ["python"],
    "playwright": [],
    "cypress": [],
};

// Categories for positioning - comprehensive list
const CATEGORIES = {
    languages: [
        "javascript", "typescript", "python", "go", "rust", "swift", "dart",
        "java", "kotlin", "c++", "c", "csharp", "ruby", "php", "scala",
        "html", "css", "sql", "shell"
    ],
    frontend: [
        "react", "nextjs", "vue", "nuxt", "angular", "svelte", "solidjs",
        "astro", "remix", "gatsby", "tailwindcss", "sass", "styledcomponents",
        "chakraui", "materialui"
    ],
    backend: [
        "fastapi", "django", "flask", "express", "nestjs", "rails", "laravel",
        "spring", "gin", "echo", "actix", "axum", "graphql", "trpc", "prisma"
    ],
    mobile: ["flutter", "swiftui", "reactnative", "jetpackcompose"],
    infra: [
        "docker", "dockerfile", "kubernetes", "terraform", "postgresql", "mysql",
        "mongodb", "redis", "sqlite", "supabase", "firebase", "jest", "vitest",
        "pytest", "playwright", "cypress"
    ],
};

interface LayoutConfig {
    x: number;
    y: number;
    startX: number;
    maxX: number;
    xStep: number;
    yStep: number;
    maxY: number;
}

function buildSkillTree(skills: SkillNode[]): TreeNode[] {
    const skillMap = new Map(skills.map(s => [s.id.toLowerCase(), s]));
    const treeNodes: TreeNode[] = [];

    // Initial positions for each category with strict zones to prevent overlap
    // yStep 16% of 600px is ~96px, enough for node + label
    const layouts: Record<string, LayoutConfig> = {
        languages: { x: 10, y: 10, startX: 10, maxX: 90, xStep: 13, yStep: 16, maxY: 40 },
        // Divide middle section into two columns
        frontend: { x: 10, y: 45, startX: 10, maxX: 45, xStep: 15, yStep: 16, maxY: 75 },
        backend: { x: 55, y: 45, startX: 55, maxX: 90, xStep: 15, yStep: 16, maxY: 75 },
        // Divide bottom section into two columns
        mobile: { x: 10, y: 80, startX: 10, maxX: 45, xStep: 15, yStep: 16, maxY: 100 },
        infra: { x: 55, y: 80, startX: 55, maxX: 90, xStep: 15, yStep: 16, maxY: 100 },
        other: { x: 40, y: 90, startX: 40, maxX: 60, xStep: 12, yStep: 16, maxY: 100 }
    };

    skills.forEach((skill) => {
        const id = skill.id.toLowerCase();
        let cat = "other";

        if (CATEGORIES.languages.includes(id)) cat = "languages";
        else if (CATEGORIES.frontend.includes(id)) cat = "frontend";
        else if (CATEGORIES.backend.includes(id)) cat = "backend";
        else if (CATEGORIES.mobile.includes(id)) cat = "mobile";
        else if (CATEGORIES.infra.includes(id)) cat = "infra";

        const layout = layouts[cat];
        let { x, y } = layout;

        // Wrap if overflow (strictly within zone)
        if (x > layout.maxX) {
            x = layout.startX;
            y += layout.yStep;
            // Update layout state for next item
            layout.y = y;
        }

        // Apply
        treeNodes.push({
            ...skill,
            id: id,
            x,
            y,
            connections: [], // Will populate later
        });

        // Advance X
        layout.x = x + layout.xStep;
    });

    // Second pass: Add connections
    treeNodes.forEach(node => {
        const deps = SKILL_DEPENDENCIES[node.id] || [];
        deps.forEach(dep => {
            if (skillMap.has(dep)) {
                node.connections.push(dep);
            }
        });
    });

    return treeNodes;
}

export function SkillTreeRPG({ onUpdate }: { onUpdate?: () => void }) {
    const { token } = useAuth();
    const [skills, setSkills] = useState<SkillNode[]>([]);
    const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSkills = async () => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/skills", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const skillsWithUnlocked = data.map((s: SkillNode) => ({
                    ...s,
                    unlocked: s.level > 0
                }));
                setSkills(skillsWithUnlocked);
                setTreeNodes(buildSkillTree(skillsWithUnlocked));
            }
        } catch (e) {
            console.error("Failed to fetch skills:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const analyzeSkills = async () => {
        if (!token) {
            setError("ログインが必要です");
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        try {
            const response = await fetch("/api/skills/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ sinceDays: 30 })
            });

            if (response.ok) {
                await fetchSkills();
                if (onUpdate) onUpdate();
            } else {
                const errData = await response.json();
                setError(errData.detail || "分析に失敗しました");
            }
        } catch (e) {
            console.error("Failed to analyze skills:", e);
            setError("分析に失敗しました");
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [token]);

    const totalExp = skills.reduce((sum, node) => sum + node.exp, 0);

    if (isLoading) {
        return (
            <div className="card flex items-center justify-center h-[600px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Skill Tree</h3>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={analyzeSkills}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1 text-xs text-primary hover:opacity-80 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                        更新
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-500">{totalExp} EXP</span>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {treeNodes.length === 0 && (
                <div className="h-[600px] flex flex-col items-center justify-center text-center">
                    <Zap className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">まだスキルがありません</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        GitHubを連携すると、リポジトリからスキルを自動分析します
                    </p>
                    <button
                        onClick={analyzeSkills}
                        disabled={isAnalyzing}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isAnalyzing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        スキルを分析
                    </button>
                    {error && (
                        <p className="mt-4 text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">
                            ⚠️ {error}
                        </p>
                    )}
                </div>
            )}

            {/* Tree Visualization */}
            {treeNodes.length > 0 && (
                <div className="relative h-[600px] bg-muted/30 rounded-xl overflow-hidden">
                    {/* Category Labels */}
                    <div className="absolute top-2 left-4 text-xs text-muted-foreground">Languages</div>
                    <div className="absolute top-[38%] left-4 text-xs text-muted-foreground">Frameworks / Backend</div>
                    <div className="absolute top-[73%] left-4 text-xs text-muted-foreground">Tools / Infra</div>

                    {/* Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {treeNodes.map((node) =>
                            node.connections.map((targetId) => {
                                const target = treeNodes.find((n) => n.id === targetId);
                                if (!target) return null;
                                return (
                                    <line
                                        key={`${node.id}-${targetId}`}
                                        x1={`${node.x}%`}
                                        y1={`${node.y}%`}
                                        x2={`${target.x}%`}
                                        y2={`${target.y}%`}
                                        stroke={node.unlocked && target.unlocked ? "#3ea8ff" : "#334155"}
                                        strokeWidth="2"
                                        strokeDasharray={node.unlocked ? "0" : "4"}
                                    />
                                );
                            })
                        )}
                    </svg>

                    {/* Skill Nodes */}
                    {treeNodes.map((node, index) => (
                        <motion.div
                            key={node.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                            style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        >
                            {/* Node Circle */}
                            <div
                                className={`
                                    w-12 h-12 rounded-full flex items-center justify-center
                                    border-2 transition-all duration-300 group-hover:scale-110
                                    ${node.unlocked
                                        ? `bg-gradient-to-br ${LEVEL_COLORS[Math.min(node.level, 3)]} border-transparent shadow-lg`
                                        : "bg-muted border-border"
                                    }
                                `}
                            >
                                {node.unlocked ? (
                                    node.level === node.maxLevel ? (
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    ) : (
                                        <span className="text-white font-bold">{node.level}</span>
                                    )
                                ) : (
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>

                            {/* Level Indicators */}
                            {node.unlocked && (
                                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                    {Array.from({ length: node.maxLevel }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 h-1 rounded-full ${i < node.level ? "bg-white" : "bg-white/30"}`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Label */}
                            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <p className={`text-[10px] font-medium text-center ${node.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                                    {node.name}
                                </p>
                                {node.unlocked && (
                                    <p className="text-[9px] text-muted-foreground text-center">{node.exp} EXP</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
