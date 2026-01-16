// Local Storage utility for Vision
// Manages user preferences and offline data

const STORAGE_KEYS = {
    THEME: "vision-theme",
    USER_PREFERENCES: "vision-preferences",
    CACHED_TASKS: "vision-cached-tasks",
    LAST_SYNC: "vision-last-sync",
} as const;

// Theme
export function getStoredTheme(): "dark" | "light" | "system" {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem(STORAGE_KEYS.THEME) as "dark" | "light" | "system") || "dark";
}

export function setStoredTheme(theme: "dark" | "light" | "system"): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// User Preferences
interface UserPreferences {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    hourlyRate: number;
    language: "ja" | "en";
}

const DEFAULT_PREFERENCES: UserPreferences = {
    notificationsEnabled: true,
    soundEnabled: true,
    hourlyRate: 3000,
    language: "ja",
};

export function getUserPreferences(): UserPreferences {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!stored) return DEFAULT_PREFERENCES;
    try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {
        return DEFAULT_PREFERENCES;
    }
}

export function setUserPreferences(prefs: Partial<UserPreferences>): void {
    const current = getUserPreferences();
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify({ ...current, ...prefs }));
}

// Cached Tasks (offline support)
export function getCachedTasks<T>(): T[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEYS.CACHED_TASKS);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function setCachedTasks<T>(tasks: T[]): void {
    localStorage.setItem(STORAGE_KEYS.CACHED_TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
}

export function getLastSyncTime(): Date | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!stored) return null;
    return new Date(stored);
}

// Clear all data
export function clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
    });
}
