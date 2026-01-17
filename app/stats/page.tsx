"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from "recharts";
import { TrendingUp, Calendar, Target, Flame, Clock, CheckCircle, Loader2 } from "lucide-react";
import { visionAPI } from "@/lib/api";

const skillDistribution = [
    { name: "Frontend", value: 45, color: "#3ea8ff" },
    { name: "Backend", value: 25, color: "#22c55e" },
    { name: "Design", value: 15, color: "#f59e0b" },
    { name: "DevOps", value: 15, color: "#8b5cf6" },
];

export default function StatsPage() {
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [monthlyProgress, setMonthlyProgress] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [weekly, monthly, summary] = await Promise.all([
                    visionAPI.getStatsWeekly(),
                    visionAPI.getMonthlyProgress(),
                    visionAPI.getStatsSummary()
                ]);
                setWeeklyData(Array.isArray(weekly) ? weekly : (weekly as any).data);
                setMonthlyProgress(Array.isArray(monthly) ? monthly : (monthly as any).data);

                // Add icons to summary
                const summaryWithIcons = summary.map((item: any, index: number) => ({
                    ...item,
                    icon: [CheckCircle, Clock, Flame, Target][index] || Target
                }));
                setStats(summaryWithIcons);
            } catch (e) {
                console.error("Failed to load stats", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary font-medium">分析</span>
                </div>
                <h1 className="text-3xl font-bold">統計ダッシュボード</h1>
                <p className="text-muted-foreground mt-1">あなたの成長を可視化</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="card">
                            <div className="flex items-center justify-between mb-2">
                                <Icon className="w-5 h-5 text-primary" />
                                <span className="text-xs text-accent font-medium">{stat.change}</span>
                            </div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Weekly Activity */}
                <div className="card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        今週のアクティビティ
                    </h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <ComposedChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                            <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                                labelStyle={{ color: "#f8fafc" }}
                            />
                            <Bar yAxisId="left" dataKey="tasks" name="完了タスク" fill="#3ea8ff" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line yAxisId="right" type="monotone" dataKey="hours" name="集中時間(h)" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly Progress */}
                <div className="card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        月間進捗
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyProgress}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                                labelStyle={{ color: "#f8fafc" }}
                            />
                            <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Skill Distribution */}
            <div className="card">
                <h3 className="font-semibold mb-4">スキル分布</h3>
                <div className="flex items-center gap-8">
                    <ResponsiveContainer width={200} height={200}>
                        <PieChart>
                            <Pie data={skillDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                {skillDistribution.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        {skillDistribution.map((skill, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: skill.color }} />
                                <span className="text-sm">{skill.name}</span>
                                <span className="text-sm text-muted-foreground ml-auto">{skill.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
