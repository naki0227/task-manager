"use client";

import { useState, useEffect } from "react";
import {
    User, Bell, Palette, Shield, Database, ExternalLink,
    Moon, Sun, Monitor, Github, Calendar, MessageSquare, Check, Mail, BookOpen,
    Layers, CheckSquare, Hash, FileText, Apple
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getUserPreferences, setUserPreferences, getStoredTheme, setStoredTheme } from "@/lib/storage";

interface SettingItem {
    label: string;
    description: string;
    action?: string;
    toggle?: boolean;
    toggleKey?: string;
    theme?: boolean;
    oauth?: string;
}

interface SettingSection {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: SettingItem[];
}

const SETTINGS_SECTIONS: SettingSection[] = [
    {
        title: "アカウント",
        icon: User,
        items: [
            { label: "プロフィール", description: "名前、アバター、自己紹介を編集", action: "編集" },
            { label: "メールアドレス", description: "user@example.com", action: "変更" },
        ],
    },
    {
        title: "外部連携",
        icon: MessageSquare,
        items: [
            { label: "GitHub", description: "リポジトリとIssueを同期", oauth: "github" },
            { label: "Google", description: "カレンダー、Tasks、Gmailを連携", oauth: "google" },
            { label: "Linear", description: "Issueトラッキングを同期", oauth: "linear" },
            { label: "Todoist", description: "既存タスクを移行", oauth: "todoist" },
            { label: "Notion", description: "ページ・DBを同期", oauth: "notion" },
            { label: "Slack", description: "メッセージからタスクを抽出", oauth: "slack" },
            { label: "Discord", description: "サーバー通知を取得", oauth: "discord" },
        ],
    },
    {
        title: "通知",
        icon: Bell,
        items: [
            { label: "プッシュ通知", description: "新しいタスクや締め切りの通知", toggle: true, toggleKey: "notificationsEnabled" },
            { label: "サウンド", description: "通知音を有効にする", toggle: true, toggleKey: "soundEnabled" },
        ],
    },
    {
        title: "外観",
        icon: Palette,
        items: [
            { label: "テーマ", description: "アプリの外観を変更", theme: true },
        ],
    },
    {
        title: "データ",
        icon: Database,
        items: [
            { label: "エクスポート", description: "データをJSON形式でダウンロード", action: "エクスポート" },
            { label: "インポート", description: "以前のデータを復元", action: "インポート" },
        ],
    },
];

const OAUTH_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
    github: { icon: Github, color: "from-gray-700 to-gray-900", label: "GitHub" },
    linear: { icon: Layers, color: "from-indigo-500 to-indigo-600", label: "Linear" },
    google: { icon: Calendar, color: "from-blue-500 to-blue-600", label: "Google Calendar" },
    apple: { icon: Apple, color: "from-gray-600 to-gray-800", label: "Apple Calendar" },
    googleTasks: { icon: Check, color: "from-green-500 to-green-600", label: "Google Tasks" },
    todoist: { icon: CheckSquare, color: "from-red-500 to-red-600", label: "Todoist" },
    gmail: { icon: Mail, color: "from-red-400 to-red-500", label: "Gmail" },
    notion: { icon: BookOpen, color: "from-gray-800 to-gray-900", label: "Notion" },
    obsidian: { icon: FileText, color: "from-purple-600 to-purple-800", label: "Obsidian" },
    slack: { icon: MessageSquare, color: "from-purple-500 to-purple-600", label: "Slack" },
    discord: { icon: Hash, color: "from-indigo-500 to-indigo-700", label: "Discord" },
};

import { useAuth } from "@/components/providers/AuthProvider";
import { visionAPI } from "@/lib/api";

// ... existing interfaces ...

export default function SettingsPage() {
    const { showToast } = useToast();
    const { user, updateUser } = useAuth();
    const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
    const [toggles, setToggles] = useState<Record<string, boolean>>({});

    // Profile Editing State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState("");

    const [connectedServices, setConnectedServices] = useState<Record<string, boolean>>({
        github: false, linear: false, google: false, apple: false,
        googleTasks: false, todoist: false, gmail: false,
        notion: false, obsidian: false, slack: false, discord: false,
    });

    useEffect(() => {
        // Load preferences
        const prefs = getUserPreferences();
        setToggles({
            notificationsEnabled: prefs.notificationsEnabled,
            soundEnabled: prefs.soundEnabled,
        });
        setTheme(getStoredTheme());

        // Check URL params for OAuth callback first
        const params = new URLSearchParams(window.location.search);

        // Capture token if present (from login flow)
        const token = params.get("token");
        const userEmail = params.get("user");

        if (token) {
            localStorage.setItem("vision-token", token);
            if (userEmail) {
                // If we get simple email, we might need to fetch full user later, 
                // but for now let's just update the token.
                // Or create a minimal user object since we don't have id/name in params
                // Ideally backend should return full user object encoded or we fetch me()
            }
            // Force reload to update AuthProvider state if it was a login
            // But since we are already in the app, maybe just let AuthProvider pick it up on reload?
            // Actually, for better UX, we should update the context. 
            // For now, let's just rely on localStorage.
        }

        const services = ["github", "google", "slack", "notion", "discord", "linear", "todoist"];
        let hasCallback = false;

        for (const service of services) {
            if (params.get(service) === "connected") {
                hasCallback = true;
                showToast("success", `${OAUTH_CONFIG[service]?.label || service} と連携しました！`);
                window.history.replaceState({}, "", "/settings");
                break;
            }
        }

        // Fetch real connected status from backend
        const fetchConnectedServices = async () => {
            const token = localStorage.getItem("vision-token");
            if (!token) return;

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            try {
                const res = await fetch(`${API_URL}/api/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const newConnected: Record<string, boolean> = {};

                    data.connected_services.forEach((s: string) => {
                        newConnected[s] = true;
                        // Special handling for unified Google
                        if (s === "google") {
                            newConnected["google"] = true;
                            newConnected["gmail"] = true;
                            newConnected["googleTasks"] = true;
                        }
                    });

                    setConnectedServices(prev => ({ ...prev, ...newConnected }));
                }
            } catch (e) {
                console.error("Failed to fetch connected services", e);
            }
        };

        fetchConnectedServices();
    }, [showToast]);

    const handleToggle = (key: string) => {
        const newValue = !toggles[key];
        setToggles(prev => ({ ...prev, [key]: newValue }));
        setUserPreferences({ [key]: newValue });
        showToast("success", "設定を保存しました");
    };

    const handleSaveProfile = async () => {
        try {
            await visionAPI.updateProfile({ name: editName });
            updateUser({ name: editName });
            setIsEditingProfile(false);
            showToast("success", "プロフィールを更新しました");
        } catch (e) {
            console.error(e);
            showToast("error", "プロフィールの更新に失敗しました");
        }
    };

    const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
        setTheme(newTheme);
        setStoredTheme(newTheme);
        showToast("success", `テーマを「${newTheme === "dark" ? "ダーク" : newTheme === "light" ? "ライト" : "システム"}」に変更しました`);
    };

    const handleOAuthConnect = (service: string) => {
        const config = OAUTH_CONFIG[service];
        if (!config) return;

        // If already connected, disconnect (mock for now)
        if (connectedServices[service]) {
            setConnectedServices(prev => ({ ...prev, [service]: false }));
            showToast("info", `${config.label} との連携を解除しました`);
            return;
        }

        // Redirect to backend OAuth endpoint
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // Map service names to backend endpoints
        const endpointMap: Record<string, string> = {
            github: "github",
            linear: "linear",
            google: "google",
            apple: "apple",  // Not implemented yet
            googleTasks: "google",  // Same as google with different scope
            todoist: "todoist",
            gmail: "google",  // Same as google with different scope
            notion: "notion",
            obsidian: "obsidian",  // Local only, no OAuth
            slack: "slack",
            discord: "discord",
        };

        const endpoint = endpointMap[service];
        const token = localStorage.getItem("vision-token");

        if (endpoint && endpoint !== "apple" && endpoint !== "obsidian") {
            window.location.href = `${API_URL}/auth/${endpoint}${token ? `?token=${token}` : ''}`;
        } else if (service === "obsidian") {
            showToast("info", "Obsidian はローカル連携です。Vault パスを設定してください。");
        } else {
            showToast("error", `${config.label} は未実装です`);
        }
    };

    return (
        <div className="max-w-3xl">
            <header className="mb-8">
                <h1 className="text-2xl font-bold">設定</h1>
                <p className="text-muted-foreground mt-1">アプリの設定をカスタマイズ</p>
            </header>

            <div className="space-y-8">
                {SETTINGS_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    return (
                        <section key={section.title}>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Icon className="w-5 h-5 text-primary" />
                                {section.title}
                            </h2>
                            <div className="card divide-y divide-border">
                                {section.items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                        {/* Profile Section Special Handling */}
                                        {item.label === "プロフィール" ? (
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="font-medium">プロフィール</p>
                                                    {!isEditingProfile ? (
                                                        <button
                                                            onClick={() => {
                                                                setEditName(user?.name || "");
                                                                setIsEditingProfile(true);
                                                            }}
                                                            className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        >
                                                            編集
                                                        </button>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setIsEditingProfile(false)}
                                                                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                                            >
                                                                キャンセル
                                                            </button>
                                                            <button
                                                                onClick={handleSaveProfile}
                                                                className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                                            >
                                                                保存
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {!isEditingProfile ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">
                                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{user?.name || "User"}</p>
                                                            <p className="text-sm text-muted-foreground">{user?.email || "No email"}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs text-muted-foreground block mb-1">名前</label>
                                                            <input
                                                                type="text"
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="font-medium">{item.label}</p>
                                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                                </div>

                                                {item.action && (
                                                    <button className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1">
                                                        {item.action}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {item.toggle && item.toggleKey && (

                                            {
                                                item.toggle && item.toggleKey && (
                                                    <button
                                                        onClick={() => handleToggle(item.toggleKey!)}
                                                        className={`w-11 h-6 rounded-full transition-colors relative ${toggles[item.toggleKey] ? "bg-primary" : "bg-muted"}`}
                                                    >
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${toggles[item.toggleKey] ? "left-6" : "left-1"}`} />
                                                    </button>
                                                )
                                            }

                                        {item.theme && (
                                            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                                {[
                                                    { value: "light" as const, icon: Sun },
                                                    { value: "dark" as const, icon: Moon },
                                                    { value: "system" as const, icon: Monitor },
                                                ].map(({ value, icon: ThemeIcon }) => (
                                                    <button
                                                        key={value}
                                                        onClick={() => handleThemeChange(value)}
                                                        className={`p-2 rounded-md transition-colors ${theme === value ? "bg-card text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                                    >
                                                        <ThemeIcon className="w-4 h-4" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {item.oauth && OAUTH_CONFIG[item.oauth] && (
                                            <button
                                                onClick={() => handleOAuthConnect(item.oauth!)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${connectedServices[item.oauth]
                                                    ? "bg-accent/10 text-accent border border-accent/20"
                                                    : `bg-gradient-to-r ${OAUTH_CONFIG[item.oauth].color} text-white`
                                                    }`}
                                            >
                                                {connectedServices[item.oauth] ? (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        連携中
                                                    </>
                                                ) : (
                                                    <>
                                                        {(() => {
                                                            const OAuthIcon = OAUTH_CONFIG[item.oauth!].icon;
                                                            return <OAuthIcon className="w-4 h-4" />;
                                                        })()}
                                                        連携する
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}

                <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-destructive" />
                        危険な操作
                    </h2>
                    <div className="card border-destructive/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-destructive">アカウントを削除</p>
                                <p className="text-sm text-muted-foreground">すべてのデータが完全に削除されます</p>
                            </div>
                            <button className="px-4 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors">
                                削除
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
