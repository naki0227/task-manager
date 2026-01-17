"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";

import { visionAPI, PreparedTask } from "@/lib/api";
import { useEffect } from "react";

// Source colors (Hex)
const SOURCE_HEX: Record<string, string> = {
    github: "#8b5cf6",
    calendar: "#3b82f6",
    google_tasks: "#0ea5e9",
    slack: "#22c55e",
    dream: "#f59e0b",
    manual: "#6b7280",
};

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split("T")[0]);
    const [tasks, setTasks] = useState<PreparedTask[]>([]);
    const [tasksByDate, setTasksByDate] = useState<Record<string, { title: string; color: string; source: string }[]>>({});

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const data = await visionAPI.getPreparedTasks();
                setTasks(data);

                // Map tasks to dates
                const mapping: Record<string, any[]> = {};
                data.forEach(task => {
                    let dateStr = "";
                    // Try to parse estimatedTime as date (from Google Sync)
                    // estimatedTime might be "2026-01-16T10:00:00Z" or "30分"
                    // Check if it starts with year-like pattern
                    if (task.estimatedTime && (task.estimatedTime.startsWith("202") || task.estimatedTime.match(/^\d{4}-\d{2}-\d{2}/))) {
                        try {
                            const d = new Date(task.estimatedTime);
                            // Use local time to avoid UTC shift
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            dateStr = `${year}-${month}-${day}`;
                        } catch (e) {
                            // ignore parse error
                        }
                    }

                    if (dateStr) {
                        if (!mapping[dateStr]) mapping[dateStr] = [];
                        mapping[dateStr].push({
                            title: task.title,
                            color: SOURCE_HEX[task.source] || "#6b7280",
                            source: task.source,
                        });
                    }
                });
                setTasksByDate(mapping);
            } catch (e) {
                console.error("Failed to load tasks", e);
            }
        };
        loadTasks();
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and total days
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate calendar grid
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const formatDateKey = (day: number) => {
        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <span className="text-sm text-primary font-medium">スケジュール</span>
                </div>
                <h1 className="text-3xl font-bold">カレンダー</h1>
                <p className="text-muted-foreground mt-1">タスクを日付で管理</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 card">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={goToPrevMonth} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold">{year}年 {MONTHS[month]}</h2>
                        <button onClick={goToNextMonth} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map((day, i) => (
                            <div key={day} className={`text-center text-sm font-medium py-2 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-muted-foreground"}`}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            if (day === null) return <div key={index} />;

                            const dateKey = formatDateKey(day);
                            const tasks = tasksByDate[dateKey] || [];
                            const isSelected = selectedDate === dateKey;
                            const todayStr = new Date().toISOString().split("T")[0];
                            const isToday = dateKey === todayStr;

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(dateKey)}
                                    className={`
                    relative p-2 h-20 rounded-lg transition-colors text-left
                    ${isSelected ? "bg-primary/20 border border-primary" : "hover:bg-muted"}
                    ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                  `}
                                >
                                    <span className={`text-sm ${isToday ? "font-bold text-primary" : ""}`}>{day}</span>
                                    <div className="mt-1 space-y-0.5">
                                        {tasks.slice(0, 2).map((task, i) => (
                                            <div
                                                key={i}
                                                className="text-[10px] px-1 py-0.5 rounded truncate"
                                                style={{ backgroundColor: `${task.color}20`, color: task.color }}
                                            >
                                                {task.title}
                                            </div>
                                        ))}
                                        {tasks.length > 2 && (
                                            <div className="text-[10px] text-muted-foreground">+{tasks.length - 2}</div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date Details */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">
                            {selectedDate ? new Date(selectedDate).toLocaleDateString("ja-JP", { month: "long", day: "numeric" }) : "日付を選択"}
                        </h3>
                        <button className="p-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {selectedTasks.length === 0 ? (
                        <p className="text-muted-foreground text-sm">タスクはありません</p>
                    ) : (
                        <div className="space-y-3">
                            {selectedTasks.map((task, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 rounded-lg"
                                    style={{ backgroundColor: `${task.color}10` }}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.color }} />
                                    <span className="font-medium">{task.title}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
