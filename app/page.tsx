"use client";

import { PreparedTasks } from "@/components/dashboard/PreparedTasks";
import { AIActivityFeed } from "@/components/dashboard/AIActivityFeed";
import { QuickLaunch } from "@/components/dashboard/QuickLaunch";
import { Sparkles, Zap, Target, ArrowRight } from "lucide-react";
import { useDream } from "@/contexts/DreamContext";
import Link from "next/link";

import { ProposalList } from "@/components/autonomous/ProposalList";

export default function Home() {
  const { dream, steps } = useDream();

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  // Get active step
  const activeStep = steps.find(s => s.status === "active");
  const completedCount = steps.filter(s => s.status === "completed").length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

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
          {/* Autonomous Proposals */}
          <ProposalList />

          {/* Prepared Tasks */}
          <PreparedTasks />
        </div>

        {/* Right Column: Sidebar Widgets */}
        <div className="space-y-6">

          {/* Goal Widget (replaces LossAversion) */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">目標</h3>
            </div>

            {dream ? (
              <>
                <p className="text-lg font-bold mb-3">{dream}</p>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">進捗</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <Link
                  href="/thinking"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  詳細を見る <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-3">まだ目標が設定されていません</p>
                <Link
                  href="/thinking"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  目標を設定する <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            )}
          </div>

          {/* Next Action Widget */}
          {activeStep && (
            <div className="card bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">今すること</h3>
              </div>

              <p className="font-medium mb-2">{activeStep.title}</p>
              {activeStep.description && (
                <p className="text-xs text-muted-foreground mb-3">{activeStep.description}</p>
              )}
              <p className="text-xs text-muted-foreground mb-3">期間: {activeStep.duration}</p>

              <Link
                href="/thinking"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                取り組む <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Quick Launch */}
          <QuickLaunch />

          {/* AI Activity */}
          <AIActivityFeed />
        </div>
      </div>
    </div>
  );
}
