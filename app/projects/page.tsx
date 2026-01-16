"use client";

import { FolderKanban, Plus, MoreHorizontal, Clock, CheckCircle2 } from "lucide-react";

const PROJECTS = [
    {
        id: 1,
        name: "Vision Frontend",
        description: "Next.js + Tailwind CSS でダッシュボードを構築",
        progress: 65,
        color: "from-blue-500 to-cyan-500",
        tasks: { completed: 8, total: 12 },
        updated: "2時間前",
    },
    {
        id: 2,
        name: "Backend API",
        description: "FastAPI + PostgreSQL でRESTful APIを実装",
        progress: 40,
        color: "from-green-500 to-emerald-500",
        tasks: { completed: 4, total: 10 },
        updated: "昨日",
    },
    {
        id: 3,
        name: "ドキュメント",
        description: "README、API仕様書、セットアップガイドの作成",
        progress: 80,
        color: "from-orange-500 to-amber-500",
        tasks: { completed: 12, total: 15 },
        updated: "3日前",
    },
    {
        id: 4,
        name: "テスト自動化",
        description: "Jest + Playwright でE2Eテストを構築",
        progress: 20,
        color: "from-purple-500 to-pink-500",
        tasks: { completed: 2, total: 8 },
        updated: "1週間前",
    },
];

export default function ProjectsPage() {
    return (
        <div className="max-w-5xl">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">プロジェクト</h1>
                    <p className="text-muted-foreground mt-1">{PROJECTS.length} 件のプロジェクト</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" />
                    新規作成
                </button>
            </header>

            {/* Project Grid */}
            <div className="grid gap-4">
                {PROJECTS.map((project) => (
                    <div key={project.id} className="card card-hover group">
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center flex-shrink-0`}>
                                <FolderKanban className="w-6 h-6 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold group-hover:text-primary transition-colors">{project.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
                                    </div>
                                    <button className="p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                                        <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>

                                {/* Progress */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${project.color} rounded-full`}
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{project.progress}%</span>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {project.tasks.completed}/{project.tasks.total} タスク
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {project.updated}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
