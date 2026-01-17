import { Play, FolderOpen, FileCode, Clock, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { visionAPI, PreparedTask } from "@/lib/api";

const SOURCE_COLORS = {
    github: "from-purple-500 to-purple-600",
    calendar: "from-blue-500 to-blue-600",
    slack: "from-green-500 to-green-600",
    dream: "from-amber-500 to-orange-500",
    manual: "from-gray-500 to-gray-600",
};

const SOURCE_LABELS = {
    github: "GitHub",
    calendar: "カレンダー",
    slack: "Slack",
    dream: "夢から逆算",
    manual: "手動作成",
};

export function PreparedTasks() {
    const [tasks, setTasks] = useState<PreparedTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const data = await visionAPI.getPreparedTasks();
                setTasks(data);
            } catch (e) {
                console.error("Failed to load tasks", e);
            } finally {
                setLoading(false);
            }
        };
        loadTasks();
    }, []);

    const handleStart = async (taskId: number) => {
        try {
            await visionAPI.startTask(taskId);
            setTasks(prev =>
                prev.map(t => t.id === taskId ? { ...t, status: "in-progress" as const } : t)
            );
        } catch (e) {
            console.error("Failed to start task", e);
        }
    };

    const readyTasks = tasks.filter(t => t.status === "ready");

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">AIが準備完了</h2>
            </div>
            <span className="text-sm text-muted-foreground">{readyTasks.length} 件のタスクが開始可能</span>
        </div>

        {/* Task Cards */}
        <div className="space-y-3">
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className={`card card-hover ${task.status === "completed" && "opacity-50"}`}
                >
                    <div className="flex gap-4">
                        {/* Left: Source Indicator */}
                        <div className={`w-1 rounded-full bg-gradient-to-b ${SOURCE_COLORS[task.source]}`} />

                        {/* Content */}
                        <div className="flex-1">
                            {/* Title Row */}
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${SOURCE_COLORS[task.source]} text-white`}>
                                            {SOURCE_LABELS[task.source]}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {task.estimatedTime}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold">{task.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
                                </div>

                                {/* Action Button */}
                                {task.status === "ready" && (
                                    <button
                                        onClick={() => handleStart(task.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shrink-0"
                                    >
                                        <Play className="w-4 h-4" />
                                        始める
                                    </button>
                                )}
                                {task.status === "in-progress" && (
                                    <span className="flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-lg font-medium shrink-0">
                                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                        作業中
                                    </span>
                                )}
                                {task.status === "completed" && (
                                    <span className="flex items-center gap-2 px-4 py-2 text-muted-foreground shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                        完了
                                    </span>
                                )}
                            </div>

                            {/* Prepared Items */}
                            <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                    <FolderOpen className="w-3 h-3" />
                                    AIが準備したもの
                                </p>
                                <ul className="space-y-1">
                                    {task.preparedItems.map((item, idx) => (
                                        <li key={idx} className="text-sm text-foreground/80 flex items-center gap-2">
                                            <FileCode className="w-3 h-3 text-primary/50" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
    );
}
