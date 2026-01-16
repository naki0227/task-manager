"use client";

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Calendar, Target, Flame, Clock, CheckCircle } from "lucide-react";

// Mock data
const weeklyData = [
    { day: "月", tasks: 5, hours: 3.5 },
    { day: "火", tasks: 8, hours: 5.2 },
    { day: "水", tasks: 3, hours: 2.1 },
    { day: "木", tasks: 7, hours: 4.8 },
    { day: "金", tasks: 6, hours: 4.0 },
    { day: "土", tasks: 2, hours: 1.5 },
    { day: "日", tasks: 4, hours: 2.8 },
];

const monthlyProgress = [
    { week: "W1", completed: 25 },
    { week: "W2", completed: 32 },
    { week: "W3", completed: 28 },
    { week: "W4", completed: 40 },
];

const skillDistribution = [
    { name: "Frontend", value: 45, color: "#3ea8ff" },
    { name: "Backend", value: 25, color: "#22c55e" },
    { name: "Design", value: 15, color: "#f59e0b" },
    { name: "DevOps", value: 15, color: "#8b5cf6" },
];

const stats = [
    { label: "今週の完了タスク", value: "35", icon: CheckCircle, change: "+12%" },
    { label: "集中時間", value: "23.9h", icon: Clock, change: "+8%" },
    { label: "連続日数", value: "7日", icon: Flame, change: "継続中" },
    { label: "達成率", value: "87%", icon: Target, change: "+5%" },
];

export default function StatsPage() {
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
                {/* Weekly Tasks */}
                <div className="card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        今週のタスク完了数
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                                labelStyle={{ color: "#f8fafc" }}
                            />
                            <Bar dataKey="tasks" fill="#3ea8ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
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
