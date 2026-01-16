"use client";

import { FolderKanban, ArrowRight } from "lucide-react";

const PROJECTS = [
    { id: 1, name: "Vision Frontend", progress: 65, color: "from-blue-500 to-cyan-500" },
    { id: 2, name: "Backend API", progress: 40, color: "from-green-500 to-emerald-500" },
    { id: 3, name: "ドキュメント", progress: 80, color: "from-orange-500 to-amber-500" },
];

export function ProjectList() {
    return (
        <div className="space-y-3">
            {PROJECTS.map((project) => (
                <div key={project.id} className="card card-hover group cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.color} flex items-center justify-center`}>
                            <FolderKanban className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-medium group-hover:text-primary transition-colors">{project.name}</p>
                                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${project.color} rounded-full`}
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">{project.progress}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
