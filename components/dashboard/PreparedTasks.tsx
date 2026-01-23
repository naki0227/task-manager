import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, FolderOpen, FileCode, Clock, Sparkles, CheckCircle2, Loader2, Trash2, Cloud, CloudOff } from "lucide-react";
import { useState, useEffect } from "react";
import { visionAPI, PreparedTask } from "@/lib/api";
import { useRxTasks, RxTask } from "@/hooks/useRxTasks";

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

// Sortable Item Component
function SortableTaskItem(props: {
    task: PreparedTask;
    onStart: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const { task, onStart, onDelete } = props;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id.toString() });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    // Helper to map generic string source to key logic if needed
    const sourceKey = (task.source in SOURCE_COLORS) ? task.source : 'manual';

    // Parse prepared items if string (RxDB storage)
    let preparedItemsList: string[] = [];
    if (typeof task.preparedItems === 'string') {
        try {
            preparedItemsList = JSON.parse(task.preparedItems);
        } catch { preparedItemsList = []; }
    } else if (Array.isArray(task.preparedItems)) {
        preparedItemsList = task.preparedItems;
    }

    // Cast task.id to string for handlers
    const taskIdStr = String(task.id);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`card card-hover ${task.status === "completed" && "opacity-50"}`}
        >
            <div className="flex gap-4">
                {/* Left: Source Indicator */}
                <div className={`w-1 rounded-full bg-gradient-to-b ${SOURCE_COLORS[sourceKey] || SOURCE_COLORS.manual}`} />

                {/* Content */}
                <div className="flex-1">
                    {/* Title Row */}
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${SOURCE_COLORS[sourceKey] || SOURCE_COLORS.manual} text-white`}>
                                    {SOURCE_LABELS[sourceKey] || "Other"}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {task.estimatedTime}
                                </span>
                            </div>
                            <h3 className="font-semibold">{task.title}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{task.description}</p>
                        </div>

                        {/* Action Button - Prevent drag when clicking buttons */}
                        <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                            {task.status === "ready" && (
                                <>
                                    <button
                                        onClick={() => onStart(taskIdStr)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shrink-0"
                                    >
                                        <Play className="w-4 h-4" />
                                        始める
                                    </button>
                                    <button
                                        onClick={() => onDelete(taskIdStr)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        title="削除"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
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
                    </div>

                    {/* Prepared Items */}
                    <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" />
                            AIが準備したもの
                        </p>
                        <ul className="space-y-1">
                            {preparedItemsList.map((item, idx) => (
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
    );
}

export function PreparedTasks() {
    // Switch to RxDB hook
    const { tasks: rxTasks, loading, startTask, deleteTask, reorderTasks } = useRxTasks();

    // Map RxTask to PreparedTask shape
    const tasks: PreparedTask[] = rxTasks.map(t => ({
        id: t.id as any, // ID mismatch (string vs number), we handle it by casting carefully
        title: t.title,
        description: t.description,
        preparedItems: typeof t.prepared_items === 'string' ? JSON.parse(t.prepared_items) : [],
        estimatedTime: t.estimated_time || "15m",
        source: (t.source as any) || "manual",
        status: (t.status as any) || "ready"
    }));

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleStart = async (taskId: string) => {
        try {
            await startTask(taskId);
        } catch (e) {
            console.error("Failed to start task", e);
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm("このタスクを削除しますか？")) return;
        try {
            await deleteTask(taskId);
        } catch (e) {
            console.error("Failed to delete task", e);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Find old/new index
            const oldIndex = rxTasks.findIndex(t => t.id === active.id);
            const newIndex = rxTasks.findIndex(t => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // Optimistic reorder if using local state? 
                // RxDB will trigger update from DB.
                // We calculate the new order array and pass to reorderTasks.
                const newOrderFn = arrayMove(rxTasks, oldIndex, newIndex);
                // We re-assign updated 'position' index to each
                const updated = newOrderFn.map((t, idx) => ({ ...t, position: idx }));

                // Call hook
                await reorderTasks(updated);
            }
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

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">AIが準備完了 (Local-First Sync)</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Cloud className="w-3 h-3" />
                        Sync On
                    </div>
                    <span className="text-sm text-muted-foreground">{readyTasks.length} 件のタスク</span>
                </div>
            </div>

            {/* Task Cards */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <SortableTaskItem
                                key={task.id}
                                task={task}
                                onStart={handleStart}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
