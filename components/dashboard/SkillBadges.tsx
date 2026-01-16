"use client";

import { Code2, Palette, Database, Brain, Rocket, Lock } from "lucide-react";

const SKILLS = [
    { id: 1, name: "フロントエンド", icon: Code2, level: 3, unlocked: true, color: "text-blue-400" },
    { id: 2, name: "デザイン", icon: Palette, level: 2, unlocked: true, color: "text-pink-400" },
    { id: 3, name: "バックエンド", icon: Database, level: 2, unlocked: true, color: "text-green-400" },
    { id: 4, name: "AI活用", icon: Brain, level: 1, unlocked: false, color: "text-purple-400" },
    { id: 5, name: "デプロイ", icon: Rocket, level: 0, unlocked: false, color: "text-orange-400" },
];

export function SkillBadges() {
    return (
        <div className="space-y-3">
            {SKILLS.map((skill) => {
                const Icon = skill.icon;
                return (
                    <div
                        key={skill.id}
                        className={`card card-hover ${!skill.unlocked && "opacity-60"}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center relative`}>
                                <Icon className={`w-5 h-5 ${skill.unlocked ? skill.color : "text-muted-foreground"}`} />
                                {!skill.unlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-lg">
                                        <Lock className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{skill.name}</p>
                                <div className="flex gap-1 mt-1.5">
                                    {[1, 2, 3].map((lvl) => (
                                        <div
                                            key={lvl}
                                            className={`w-8 h-1.5 rounded-full transition-colors ${lvl <= skill.level
                                                    ? "bg-gradient-to-r from-primary to-blue-400"
                                                    : "bg-muted"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">Lv.{skill.level}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
