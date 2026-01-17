// i18n Translation System

export type Locale = "ja" | "en";

export const translations = {
    ja: {
        // Navigation
        dashboard: "ダッシュボード",
        thinking: "夢の計画",
        context: "コンテキスト",
        skills: "スキル",
        stats: "統計",
        calendar: "カレンダー",
        chat: "チャット",
        settings: "設定",

        // Dashboard
        welcome: "おかえりなさい",
        aiPrepared: "AIが準備完了",
        tasksReady: "件のタスクが開始可能",
        start: "始める",
        working: "作業中",

        // Loss Aversion
        opportunityLoss: "機会損失",
        realTimeCalculating: "リアルタイム計算中",
        potentialLoss: "放置により失った可能性のある価値",
        idleTime: "放置時間",
        hourlyRate: "時間価値",
        startNow: "今すぐ作業を始める",

        // Focus Timer
        focusMode: "集中モード",
        breakMode: "休憩モード",
        todaySessions: "本日のセッション",

        // Skills
        skillTree: "スキルツリー",
        totalExp: "合計EXP",
        acquiredSkills: "習得スキル",
        growing: "成長中",

        // Stats
        statsTitle: "統計ダッシュボード",
        weeklyTasks: "今週のタスク",
        monthlyProgress: "月間進捗",
        skillDistribution: "スキル分布",
        completedTasks: "完了タスク",
        focusTime: "集中時間",
        consecutiveDays: "連続日数",
        achievementRate: "達成率",

        // Calendar
        calendarTitle: "カレンダー",
        selectDate: "日付を選択",
        noTasks: "タスクはありません",

        // Chat
        chatTitle: "チャット",
        chatDescription: "Visionと対話して操作",
        typeMessage: "メッセージを入力...",

        // Settings
        settingsTitle: "設定",
        account: "アカウント",
        integrations: "外部連携",
        notifications: "通知",
        appearance: "外観",
        data: "データ",
        language: "言語",
        theme: "テーマ",
        dark: "ダーク",
        light: "ライト",
        system: "システム",
        connect: "連携する",
        connected: "連携中",

        // Common
        menu: "メニュー",
        streak: "連続",
        days: "日",
    },
    en: {
        // Navigation
        dashboard: "Dashboard",
        thinking: "Mind Map",
        context: "Context",
        skills: "Skills",
        stats: "Stats",
        calendar: "Calendar",
        chat: "Chat",
        settings: "Settings",

        // Dashboard
        welcome: "Welcome back",
        aiPrepared: "AI Prepared",
        tasksReady: "tasks ready to start",
        start: "Start",
        working: "Working",

        // Loss Aversion
        opportunityLoss: "Opportunity Loss",
        realTimeCalculating: "Calculating in real-time",
        potentialLoss: "Potential value lost due to inactivity",
        idleTime: "Idle time",
        hourlyRate: "Hourly value",
        startNow: "Start working now",

        // Focus Timer
        focusMode: "Focus Mode",
        breakMode: "Break Mode",
        todaySessions: "Today's sessions",

        // Skills
        skillTree: "Skill Tree",
        totalExp: "Total EXP",
        acquiredSkills: "Skills Acquired",
        growing: "Growing",

        // Stats
        statsTitle: "Stats Dashboard",
        weeklyTasks: "Weekly Tasks",
        monthlyProgress: "Monthly Progress",
        skillDistribution: "Skill Distribution",
        completedTasks: "Completed",
        focusTime: "Focus Time",
        consecutiveDays: "Streak",
        achievementRate: "Achievement",

        // Calendar
        calendarTitle: "Calendar",
        selectDate: "Select a date",
        noTasks: "No tasks",

        // Chat
        chatTitle: "Chat",
        chatDescription: "Talk to Vision",
        typeMessage: "Type a message...",

        // Settings
        settingsTitle: "Settings",
        account: "Account",
        integrations: "Integrations",
        notifications: "Notifications",
        appearance: "Appearance",
        data: "Data",
        language: "Language",
        theme: "Theme",
        dark: "Dark",
        light: "Light",
        system: "System",
        connect: "Connect",
        connected: "Connected",

        // Common
        menu: "Menu",
        streak: "Streak",
        days: "days",
    },
} as const;

export type TranslationKey = keyof typeof translations.ja;

export function t(key: TranslationKey, locale: Locale = "ja"): string {
    return translations[locale][key] || key;
}
