"use client";

import { useState } from "react";
import { SystemStatusBar } from "@/components/SystemStatusBar";
import { InvestigationDashboard } from "@/components/InvestigationDashboard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { SystemBootLoader } from "@/components/SystemBootLoader";

type View = "investigation" | "analytics";

export default function DashboardPage() {
  const [view, setView] = useState<View>("investigation");
  // Default to false so the user immediately lands on the clean neo-brutalist dashboard
  const [showBootLoader, setShowBootLoader] = useState(false);

  return (
    <div className="flex flex-1 flex-col min-h-screen text-black">
      {/* Smart City AI System Boot Sequence Overlay */}
      <SystemBootLoader
        isOpen={showBootLoader}
        onComplete={() => setShowBootLoader(false)}
      />

      {/* Sleek Technical Navigation Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b-1.5 border-slate-400 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 lg:gap-6 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-white">
              <span className="text-xl">🏙️</span>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-xs bg-emerald-600 text-[8px] text-white font-bold border border-white">
                ✓
              </span>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 uppercase">
                City AI Traffic Intelligence
              </h1>
            </div>
          </div>

          {/* Segmented Tab Switchers */}
          <nav className="flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 p-1 shrink-0">
            {(
              [
                { value: "investigation", label: "Target Investigation", shortLabel: "Investigation", icon: "🎯" },
                { value: "analytics", label: "Traffic Analytics", shortLabel: "Analytics", icon: "📊" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setView(tab.value)}
                className={`flex items-center gap-1.5 sm:gap-2 rounded-xs px-3 sm:px-4 py-1.5 text-sm font-semibold tracking-wide uppercase transition-all cursor-pointer ${
                  view === tab.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-800 hover:bg-slate-200/80"
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Real-time Status HUD & Diagnostics Replay Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowBootLoader(true)}
            title="Replay System Diagnostics & Boot Sequence"
            className="hidden md:flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
          >
            <span>⚡</span>
            <span>Boot Sequence</span>
          </button>

          <SystemStatusBar />
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex flex-1 flex-col">
        {view === "investigation" ? <InvestigationDashboard /> : <AnalyticsDashboard />}
      </main>
    </div>
  );
}
