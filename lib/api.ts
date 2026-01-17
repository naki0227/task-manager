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
    timestamp: string;
    windows: { type: "code" | "browser" | "docs"; name: string }[];
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

export interface DreamStep {
    id: number;
    title: string;
    duration: string;
    status: "pending" | "active" | "completed";
}

// API Client
class VisionAPIClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Prepared Tasks
    async getPreparedTasks(): Promise<PreparedTask[]> {
        return this.fetch<PreparedTask[]>("/api/prepared-tasks");
    }

    async startTask(taskId: number): Promise<void> {
        return this.fetch(`/api/prepared-tasks/${taskId}/start`, { method: "POST" });
    }

    async completeTask(taskId: number): Promise<void> {
        return this.fetch(`/api/prepared-tasks/${taskId}/complete`, { method: "POST" });
    }

    // AI Activity
    async getAIActivities(): Promise<AIActivity[]> {
        return this.fetch<AIActivity[]>("/api/ai-activities");
    }

    // Context Snapshots (Infinite Resume)
    async getSnapshots(): Promise<ContextSnapshot[]> {
        return this.fetch<ContextSnapshot[]>("/api/snapshots");
    }

    async resumeSnapshot(snapshotId: number): Promise<void> {
        return this.fetch(`/api/snapshots/${snapshotId}/resume`, { method: "POST" });
    }

    async createSnapshot(name: string): Promise<ContextSnapshot> {
        return this.fetch<ContextSnapshot>("/api/snapshots", {
            method: "POST",
            body: JSON.stringify({ name }),
        });
    }

    // Skills
    async getSkills(): Promise<SkillNode[]> {
        return this.fetch<SkillNode[]>("/api/skills");
    }

    // Stats
    async getStatsWeekly(): Promise<any[]> {
        if (USE_MOCK) return MOCK_WEEKLY_DATA;
        return this.fetch<any[]>("/api/stats/weekly");
    }

    async getMonthlyProgress(): Promise<any[]> {
        if (USE_MOCK) return MOCK_MONTHLY_PROGRESS;
        return this.fetch<any[]>("/api/stats/monthly");
    }

    async getStatsSummary(): Promise<any[]> {
        if (USE_MOCK) return MOCK_STATS_SUMMARY;
        return this.fetch<any[]>("/api/stats/summary");
    }

    // Chat
    async chatWithAI(message: string): Promise<string> {
        if (USE_MOCK) {
            // Simple mock response logic
            await new Promise(r => setTimeout(r, 1000));
            if (message.includes("タスク")) return "タスクについてですね。新しいタスクを追加しますか？";
            if (message.includes("集中")) return "集中モードを開始しますか？25分のタイマーをセットできます。";
            return "承知しました。他に何かお手伝いできることはありますか？";
        }

        const res = await this.fetch<{ response: string }>("/api/chat", {
            method: "POST",
            body: JSON.stringify({ message }),
        });
        return res.response;
    }

    // Dream to Steps
    async analyzeDream(dream: string): Promise<DreamStep[]> {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 2000));
            return [
                { id: 1, title: "基礎学習", duration: "1ヶ月", status: "pending" },
                { id: 2, title: "実践プロジェクト", duration: "2ヶ月", status: "pending" },
                { id: 3, title: "ポートフォリオ作成", duration: "2週間", status: "pending" },
            ];
        }
        return this.fetch<DreamStep[]>("/api/skills/analyze", {
            method: "POST",
            body: JSON.stringify({ dream }),
        });
    }

    // Loss Aversion
    async getLossData(): Promise<{ hourlyRate: number; idleMinutes: number }> {
        if (USE_MOCK) return { hourlyRate: 2500, idleMinutes: 45 };
        return this.fetch("/api/loss-data");
    }
}

// Export singleton instance
export const visionAPI = new VisionAPIClient();

// Configuration
export const USE_MOCK = true; // Set to false to use real API

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
    lossData: ["loss-data"] as const,
    statsWeekly: ["stats-weekly"] as const,
    statsMonthly: ["stats-monthly"] as const,
    statsSummary: ["stats-summary"] as const,
};
