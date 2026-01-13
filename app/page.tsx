"use client";

import { LossTicker } from "@/components/dashboard/LossTicker";
import { FlowGraph } from "@/components/visuals/FlowGraph";
import { SkillTree } from "@/components/visuals/SkillTree";


export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">
            COMMAND_CENTER
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            OPERATOR: GUEST_USER | SESSION_ID: #8X92-A
          </p>
        </div>
        <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 rounded-full">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-500 font-mono font-bold">SYSTEM_OPTIMAL</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Loss Aversion Module */}
        <div className="col-span-1 space-y-6">
          <LossTicker hourlyRate={3600} initialLoss={0} />

          <div className="p-6 rounded-lg border border-white/5 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono text-muted-foreground">ACTIVE_TASKS</h3>
              <span className="text-xs bg-primary/20 text-primary px-1.5 rounded">2</span>
            </div>
            <div className="space-y-4">
              <div className="group flex items-start gap-3 p-3 rounded bg-white/5 border-l-2 border-primary hover:bg-white/10 transition-colors cursor-pointer">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">Frontend Implementation</p>
                  <p className="text-xs text-muted-foreground">in_progress | 00:45:12 elapsed</p>
                </div>
              </div>
              <div className="group flex items-start gap-3 p-3 rounded bg-white/5 border-l-2 border-muted hover:bg-white/10 transition-colors cursor-pointer">
                <div className="mt-1 h-2 w-2 rounded-full bg-muted" />
                <div>
                  <p className="text-sm font-medium text-white/80">Backend API Integration</p>
                  <p className="text-xs text-muted-foreground">pending | queue_pos: 1</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Synergy Module */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <FlowGraph />

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-white/5 bg-white/5 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white"><path d="M12 2v20M2 12h20" /></svg>
              </div>
              <h3 className="text-sm font-mono text-muted-foreground mb-2">CPU_LOAD</h3>
              <div className="text-3xl font-bold text-white font-mono">12<span className="text-sm text-muted-foreground ml-1">%</span></div>
              <div className="h-1 w-full bg-white/10 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[12%]" />
              </div>
            </div>
            <div className="p-6 rounded-lg border border-white/5 bg-white/5 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary"><circle cx="12" cy="12" r="10" /></svg>
              </div>
              <h3 className="text-sm font-mono text-muted-foreground mb-2">FOCUS_SCORE</h3>
              <div className="text-3xl font-bold text-primary font-mono">89<span className="text-sm text-primary/60 ml-1">/100</span></div>
              <div className="h-1 w-full bg-white/10 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[89%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Auto Skill Tree Module */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <SkillTree />
        </div>
      </div>
    </div>
  );
}
