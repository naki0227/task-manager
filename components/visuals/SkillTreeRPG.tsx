"use client";

import { motion } from "framer-motion";
import { Star, Lock, CheckCircle, Zap } from "lucide-react";

interface SkillNode {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    exp: number;
    unlocked: boolean;
    x: number;
    y: number;
    connections: string[];
}

const SKILL_NODES: SkillNode[] = [
    // Core
    { id: "core", name: "基礎", level: 3, maxLevel: 3, exp: 100, unlocked: true, x: 50, y: 20, connections: ["frontend", "backend"] },
    // Frontend branch
    { id: "frontend", name: "Frontend", level: 2, maxLevel: 3, exp: 75, unlocked: true, x: 25, y: 40, connections: ["react", "css"] },
    { id: "react", name: "React", level: 2, maxLevel: 3, exp: 60, unlocked: true, x: 15, y: 60, connections: ["nextjs"] },
    { id: "css", name: "CSS", level: 3, maxLevel: 3, exp: 90, unlocked: true, x: 35, y: 60, connections: ["tailwind"] },
    { id: "nextjs", name: "Next.js", level: 1, maxLevel: 3, exp: 40, unlocked: true, x: 10, y: 80, connections: [] },
    { id: "tailwind", name: "Tailwind", level: 2, maxLevel: 3, exp: 70, unlocked: true, x: 40, y: 80, connections: [] },
    // Backend branch
    { id: "backend", name: "Backend", level: 1, maxLevel: 3, exp: 35, unlocked: true, x: 75, y: 40, connections: ["python", "database"] },
    { id: "python", name: "Python", level: 1, maxLevel: 3, exp: 30, unlocked: true, x: 65, y: 60, connections: ["fastapi"] },
    { id: "database", name: "Database", level: 1, maxLevel: 3, exp: 25, unlocked: true, x: 85, y: 60, connections: ["postgres"] },
    { id: "fastapi", name: "FastAPI", level: 0, maxLevel: 3, exp: 10, unlocked: false, x: 60, y: 80, connections: [] },
    { id: "postgres", name: "PostgreSQL", level: 0, maxLevel: 3, exp: 5, unlocked: false, x: 90, y: 80, connections: [] },
];

const LEVEL_COLORS = [
    "from-gray-500 to-gray-600",
    "from-green-500 to-emerald-500",
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
];

export function SkillTreeRPG() {
    const totalExp = SKILL_NODES.reduce((sum, node) => sum + node.exp, 0);

    return (
        <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Skill Tree</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500">{totalExp} EXP</span>
                </div>
            </div>

            {/* Tree Visualization */}
            <div className="relative h-[400px] bg-muted/30 rounded-xl overflow-hidden">
                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {SKILL_NODES.map((node) =>
                        node.connections.map((targetId) => {
                            const target = SKILL_NODES.find((n) => n.id === targetId);
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
                                    strokeDasharray={target.unlocked ? "0" : "4"}
                                />
                            );
                        })
                    )}
                </svg>

                {/* Skill Nodes */}
                {SKILL_NODES.map((node, index) => (
                    <motion.div
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                        {/* Node Circle */}
                        <div
                            className={`
                w-14 h-14 rounded-full flex items-center justify-center
                border-2 transition-all duration-300 group-hover:scale-110
                ${node.unlocked
                                    ? `bg-gradient-to-br ${LEVEL_COLORS[node.level]} border-transparent shadow-lg`
                                    : "bg-muted border-border"
                                }
              `}
                        >
                            {node.unlocked ? (
                                node.level === node.maxLevel ? (
                                    <CheckCircle className="w-6 h-6 text-white" />
                                ) : (
                                    <span className="text-white font-bold text-lg">{node.level}</span>
                                )
                            ) : (
                                <Lock className="w-5 h-5 text-muted-foreground" />
                            )}
                        </div>

                        {/* Level Indicator */}
                        {node.unlocked && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                {Array.from({ length: node.maxLevel }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-1 rounded-full ${i < node.level ? "bg-white" : "bg-white/30"
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Label */}
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <p className={`text-xs font-medium text-center ${node.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                                {node.name}
                            </p>
                            {node.unlocked && (
                                <p className="text-[10px] text-muted-foreground text-center">{node.exp} EXP</p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
