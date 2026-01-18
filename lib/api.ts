// Vision API Client
// Prepared for Python backend integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types
export interface PreparedTask {
    id: number;
    title: string;
    description: string;
    preparedItems: string[];
    estimatedTime: string;
    source: "github" | "calendar" | "slack" | "dream";
    status: "ready" | "in-progress" | "completed";
}

export interface AIActivity {
    id: number;
    type: "folder" | "file" | "summary" | "analysis";
    message: string;
    timestamp: string;
}

export interface ContextSnapshot {
    id: number;
    name: string;
    created_at: string;
    windows: {
        type: "code" | "browser" | "docs";
        name: string;
        urls?: string[];
        path?: string;
    }[];
    notes: string;
}

export interface SkillNode {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    exp: number;
    unlocked: boolean;
}

export interface SubTask {
    week: string;
    task: string;
    freeResource?: string;
    paidResource?: string;
}

export interface DreamStep {
    id: number;
    title: string;
    description?: string;
    duration: string;
    status: "pending" | "active" | "completed";
    subTasks?: SubTask[];
}

// API Client
class VisionAPIClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const token = typeof window !== 'undefined' ? localStorage.getItem("vision-token") : null;
        console.log(`[VisionAPI] Fetching ${endpoint}, Token exists: ${!!token}`);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                ...options?.headers,
            },
            ...options,
        });

        if (response.status === 401) {
            // Handle unauthorized (redirect to login)
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }


        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Prepared Tasks
    async getPreparedTasks(): Promise<PreparedTask[]> {
        if (useMock('tasks')) return []; // No mock data for tasks defined in this file currently
        return this.fetch<PreparedTask[]>("/api/prepared-tasks");
    }

    async startTask(taskId: number): Promise<void> {
        if (useMock('tasks')) return;
        return this.fetch(`/api/prepared-tasks/${taskId}/start`, { method: "POST" });
    }

    async completeTask(taskId: number): Promise<void> {
        if (useMock('tasks')) return;
        return this.fetch(`/api/prepared-tasks/${taskId}/complete`, { method: "POST" });
    }

    async deleteTask(taskId: number): Promise<void> {
        return this.fetch(`/api/prepared-tasks/${taskId}`, {
            method: "DELETE",
        });
    }

    async reorderTasks(taskIds: number[]): Promise<void> {
        return this.fetch("/api/prepared-tasks/reorder", {
            method: "PUT",
            body: JSON.stringify({ task_ids: taskIds }),
        });
    }

    // System / Quick Launch
    async launchAction(actionId: string): Promise<void> {
        return this.fetch("/api/system/launch", {
            method: "POST",
            body: JSON.stringify({ action_id: actionId }),
        });
    }

    async getSystemConfig(): Promise<{ is_cloud_env: boolean }> {
        return this.fetch<{ is_cloud_env: boolean }>("/api/system/config");
    }

    // AI Activity
    async getAIActivities(): Promise<AIActivity[]> {
        if (useMock('chat')) return [];
        return this.fetch<AIActivity[]>("/api/ai-activities");
    }

    // Context Snapshots (Infinite Resume)
    async getSnapshots(): Promise<ContextSnapshot[]> {
        if (useMock('tasks')) return [];
        return this.fetch<ContextSnapshot[]>("/api/snapshots");
    }

    async resumeSnapshot(snapshotId: number): Promise<void> {
        if (useMock('tasks')) return;
        return this.fetch(`/api/snapshots/${snapshotId}/resume`, { method: "POST" });
    }

    async createSnapshot(name: string, notes: string = ""): Promise<ContextSnapshot> {
        if (useMock('tasks')) throw new Error("Mock not implemented");
        return this.fetch<ContextSnapshot>("/api/snapshots", {
            method: "POST",
            body: JSON.stringify({ name, notes }),
        });
    }

    // Skills
    async getSkills(): Promise<SkillNode[]> {
        if (useMock('skills')) return [];
        return this.fetch<SkillNode[]>("/api/skills");
    }

    // Stats
    async getStatsWeekly(): Promise<any[]> {
        if (useMock('stats')) return MOCK_WEEKLY_DATA;
        return this.fetch<any[]>("/api/stats/weekly");
    }

    async getMonthlyProgress(): Promise<any[]> {
        if (useMock('stats')) return MOCK_MONTHLY_PROGRESS;
        return this.fetch<any[]>("/api/stats/monthly");
    }

    async getStatsSummary(): Promise<any[]> {
        if (useMock('stats')) return MOCK_STATS_SUMMARY;
        return this.fetch<any[]>("/api/stats/summary");
    }

    // Chat
    async chatWithAI(message: string): Promise<string> {
        if (useMock('chat')) {
            // Simple mock response logic
            await new Promise(r => setTimeout(r, 1000));
            if (message.includes("タスク")) return "タスクについてですね。新しいタスクを追加しますか？";
            if (message.includes("集中")) return "集中モードを開始しますか？25分のタイマーをセットできます。";
            return "承知しました。他に何かお手伝いできることはありますか？";
        }

        try {
            const res = await this.fetch<{ response: string }>("/api/chat", {
                method: "POST",
                body: JSON.stringify({ message }),
            });
            return res.response;
        } catch (error) {
            console.error("Chat Error:", error);
            // Fallback
            return "すみません、エラーが発生しました。もう一度お試しください。";
        }
    }

    // Dream to Steps
    async analyzeDream(dream: string, targetDuration?: string): Promise<DreamStep[]> {
        if (useMock('skills')) {
            await new Promise(r => setTimeout(r, 2000));
            return [
                { id: 1, title: "基礎学習", duration: "1ヶ月", status: "pending" },
                { id: 2, title: "実践プロジェクト", duration: "2ヶ月", status: "pending" },
                { id: 3, title: "ポートフォリオ作成", duration: "2週間", status: "pending" },
            ];
        }
        return this.fetch<DreamStep[]>("/api/dream/analyze", {
            method: "POST",
            body: JSON.stringify({ dream, targetDuration }),
        });
    }

    // Loss Aversion

    // User Profile
    async updateProfile(data: { name?: string; bio?: string; avatar_url?: string; email?: string }): Promise<any> {
        if (useMock('user')) throw new Error("Mock not implemented for user update");
        return this.fetch("/api/users/me", {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    }
}

// Export singleton instance
export const visionAPI = new VisionAPIClient();

// Configuration
export const API_CONFIG = {
    useReal: {
        tasks: true,    // ✅ Implemented
        stats: true,    // ✅ Implemented
        skills: true,   // ✅ Implemented (Dream Analysis)
        chat: true,     // ✅ Implemented
        user: true,     // ✅ Implemented
    }
};

// Deprecated: simplistic toggle
export const USE_MOCK = false;

// Helper to check if we should use mock for a feature
const useMock = (feature: keyof typeof API_CONFIG.useReal) => !API_CONFIG.useReal[feature];


// Mock Data (to be removed when API is ready)
const MOCK_WEEKLY_DATA = [
    { day: "月", tasks: 5, hours: 3.5 },
    { day: "火", tasks: 8, hours: 5.2 },
    { day: "水", tasks: 3, hours: 2.1 },
    { day: "木", tasks: 7, hours: 4.8 },
    { day: "金", tasks: 6, hours: 4.0 },
    { day: "土", tasks: 2, hours: 1.5 },
    { day: "日", tasks: 4, hours: 2.8 },
];

const MOCK_MONTHLY_PROGRESS = [
    { week: "W1", completed: 25 },
    { week: "W2", completed: 32 },
    { week: "W3", completed: 28 },
    { week: "W4", completed: 40 },
];

const MOCK_STATS_SUMMARY = [
    { label: "今週の完了タスク", value: "35", change: "+12%" },
    { label: "集中時間", value: "23.9h", change: "+8%" },
    { label: "連続日数", value: "7日", change: "継続中" },
    { label: "達成率", value: "87%", change: "+5%" },
];

// React Query hooks keys
export const API_KEYS = {
    preparedTasks: ["prepared-tasks"] as const,
    aiActivities: ["ai-activities"] as const,
    snapshots: ["snapshots"] as const,
    skills: ["skills"] as const,
    statsWeekly: ["stats-weekly"] as const,
    statsMonthly: ["stats-monthly"] as const,
    statsSummary: ["stats-summary"] as const,
};
