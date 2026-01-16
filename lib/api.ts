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

    // Dream to Steps
    async analyzeDream(dream: string): Promise<DreamStep[]> {
        return this.fetch<DreamStep[]>("/api/dream/analyze", {
            method: "POST",
            body: JSON.stringify({ dream }),
        });
    }

    // Loss Aversion
    async getLossData(): Promise<{ hourlyRate: number; idleMinutes: number }> {
        return this.fetch("/api/loss-data");
    }
}

// Export singleton instance
export const visionAPI = new VisionAPIClient();

// React Query hooks (for future use)
export const API_KEYS = {
    preparedTasks: ["prepared-tasks"] as const,
    aiActivities: ["ai-activities"] as const,
    snapshots: ["snapshots"] as const,
    skills: ["skills"] as const,
    lossData: ["loss-data"] as const,
};
