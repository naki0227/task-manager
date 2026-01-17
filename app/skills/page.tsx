"use client";

import { useEffect, useState } from "react";
import { SkillTreeRPG } from "@/components/visuals/SkillTreeRPG";
import { Trophy, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface Skill {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    exp: number;
    unlocked: boolean;
}

export default function SkillsPage() {
    const { token } = useAuth();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
                setSkills(data);
            }
        } catch (e) {
            console.error("Failed to fetch skills:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [token]);

    const handleUpdate = () => {
        fetchSkills();
    };

    // Calculate stats from actual data
    const totalExp = skills.reduce((sum, s) => sum + s.exp, 0);
    const skillCount = skills.length;
    const avgLevel = skillCount > 0
        ? (skills.reduce((sum, s) => sum + s.level, 0) / skillCount).toFixed(1)
        : "0";

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary font-medium">成長記録</span>
                </div>
                <h1 className="text-3xl font-bold">スキルツリー</h1>
                <p className="text-muted-foreground mt-1">あなたの成長をRPG風に可視化</p>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="card text-center">
                    {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                    ) : (
                        <p className="text-3xl font-bold gradient-text">{totalExp}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">合計EXP</p>
                </div>
                <div className="card text-center">
                    {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                    ) : (
                        <p className="text-3xl font-bold text-accent">{skillCount}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">習得スキル</p>
                </div>
                <div className="card text-center">
                    {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                    ) : (
                        <>
                            <p className="text-3xl font-bold text-primary">Lv.{avgLevel}</p>
                            <p className="text-sm text-muted-foreground mt-1">平均レベル</p>
                        </>
                    )}
                </div>
            </div>

            {/* Skill Tree */}
            <SkillTreeRPG onUpdate={handleUpdate} />
        </div>
    );
}
