"use client";

import { useState, useEffect } from "react";
import {
    User, Bell, Palette, Shield, Database, ExternalLink,
    Moon, Sun, Monitor, Github, Calendar, MessageSquare, Check
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
    oauth?: "github" | "google" | "slack";
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
            { label: "Google カレンダー", description: "予定をタスクに変換", oauth: "google" },
            { label: "Slack", description: "メッセージからタスクを抽出", oauth: "slack" },
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

const OAUTH_CONFIG = {
    github: { icon: Github, color: "from-gray-700 to-gray-900", label: "GitHub" },
    google: { icon: Calendar, color: "from-blue-500 to-blue-600", label: "Google" },
    slack: { icon: MessageSquare, color: "from-purple-500 to-purple-600", label: "Slack" },
};

export default function SettingsPage() {
    const { showToast } = useToast();
    const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
    const [toggles, setToggles] = useState<Record<string, boolean>>({});
    const [connectedServices, setConnectedServices] = useState<Record<string, boolean>>({
        github: false,
        google: false,
        slack: false,
    });

    // Load saved settings on mount
    useEffect(() => {
        const prefs = getUserPreferences();
        setToggles({
            notificationsEnabled: prefs.notificationsEnabled,
            soundEnabled: prefs.soundEnabled,
        });
        setTheme(getStoredTheme());
    }, []);

    // Handle toggle change
    const handleToggle = (key: string) => {
        const newValue = !toggles[key];
        setToggles(prev => ({ ...prev, [key]: newValue }));
        setUserPreferences({ [key]: newValue });
        showToast("success", "設定を保存しました");
    };

    // Handle theme change
    const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
        setTheme(newTheme);
        setStoredTheme(newTheme);
        showToast("success", `テーマを「${newTheme === "dark" ? "ダーク" : newTheme === "light" ? "ライト" : "システム"}」に変更しました`);
    };

    // Handle OAuth connection
    const handleOAuthConnect = (service: "github" | "google" | "slack") => {
        // In real implementation, this would redirect to OAuth flow
        // For now, simulate connection
        setConnectedServices(prev => ({ ...prev, [service]: !prev[service] }));
        const config = OAUTH_CONFIG[service];
        if (!connectedServices[service]) {
            showToast("success", `${config.label} と連携しました`);
        } else {
            showToast("info", `${config.label} との連携を解除しました`);
        }
    };

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-2xl font-bold">設定</h1>
                <p className="text-muted-foreground mt-1">アプリの設定をカスタマイズ</p>
            </header>

            {/* Settings Sections */}
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

                                        {item.toggle && item.toggleKey && (
                                            <button
                                                onClick={() => handleToggle(item.toggleKey!)}
                                                className={`w-11 h-6 rounded-full transition-colors relative ${toggles[item.toggleKey] ? "bg-primary" : "bg-muted"
                                                    }`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${toggles[item.toggleKey] ? "left-6" : "left-1"
                                                    }`} />
                                            </button>
                                        )}

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
                                                        className={`p-2 rounded-md transition-colors ${theme === value ? "bg-card text-primary" : "text-muted-foreground hover:text-foreground"
                                                            }`}
                                                    >
                                                        <ThemeIcon className="w-4 h-4" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {item.oauth && (
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

                {/* Danger Zone */}
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
