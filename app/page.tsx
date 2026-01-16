"use client";

import { PreparedTasks } from "@/components/dashboard/PreparedTasks";
import { AIActivityFeed } from "@/components/dashboard/AIActivityFeed";
import { QuickLaunch } from "@/components/dashboard/QuickLaunch";
import { LossAversion } from "@/components/dashboard/LossAversion";
import { Sparkles, Zap } from "lucide-react";

export default function Home() {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="max-w-6xl">
      {/* Welcome Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-sm text-primary font-medium">準備完了</span>
        </div>
        <h1 className="text-3xl font-bold">おかえりなさい 👋</h1>
        <p className="text-muted-foreground mt-1">{today}</p>
        <p className="text-sm text-foreground/70 mt-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AIが3件のタスクを準備しました。あとは始めるだけです。
        </p>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prepared Tasks */}
          <PreparedTasks />
        </div>

        {/* Right Column: Sidebar Widgets */}
        <div className="space-y-6">
          {/* Loss Aversion */}
          <LossAversion hourlyRate={3000} initialIdleMinutes={45} />

          {/* Quick Launch */}
          <QuickLaunch />

          {/* AI Activity */}
          <AIActivityFeed />
        </div>
      </div>
    </div>
  );
}
