"use client";

import { useState } from "react";
import { SystemStatusBar } from "@/components/SystemStatusBar";
import { InvestigationDashboard } from "@/components/InvestigationDashboard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { SystemBootLoader } from "@/components/SystemBootLoader";

type View = "investigation" | "analytics";

export default function DashboardPage() {
  const [view, setView] = useState<View>("investigation");
  // Set to true so that when site opens, the high-tech boot sequence is presented!
  const [showBootLoader, setShowBootLoader] = useState(true);

  return (
    <div className="flex flex-1 flex-col min-h-screen text-slate-900">
      {/* Cinematic Smart City AI System Boot Sequence Overlay */}
      <SystemBootLoader
        isOpen={showBootLoader}
        onComplete={() => setShowBootLoader(false)}
      />

      {/* Crisp High-Contrast Navigation Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/98 px-4 py-2.5 sm:px-6 shadow-xs">
        <div className="flex items-center gap-3 lg:gap-6 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300 bg-sky-50 text-sky-700 shadow-xs">
              <span className="text-xl">🏙️</span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white font-black shadow-xs">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="rounded bg-sky-100 px-1.5 py-0.2 text-[9px] font-mono font-black tracking-widest text-sky-800 border border-sky-200">
                  SIH26127
                </span>
                <span className="hidden sm:inline text-[10px] font-extrabold text-slate-600 uppercase tracking-widest font-mono">
                  SMART CITY SURVEILLANCE
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>City AI Traffic Intelligence</span>
                <span className="hidden lg:inline text-[9px] font-mono text-sky-800 font-extrabold border border-sky-200 px-1.5 py-0.2 rounded bg-sky-50">
                  v2.4 NEURAL
                </span>
              </h1>
            </div>
          </div>

          {/* Elevated Tab Switchers */}
          <nav className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/90 p-1 shadow-xs shrink-0">
            {(
              [
                { value: "investigation", label: "3D Target Investigation", shortLabel: "Investigation", icon: "🎯" },
                { value: "analytics", label: "City Traffic Analytics", shortLabel: "Analytics", icon: "📊" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setView(tab.value)}
                className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-3.5 py-1.5 text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  view === tab.value
                    ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:text-slate-950 hover:bg-white"
                }`}
              >
                <span className="text-xs sm:text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Real-time Status HUD & Diagnostics Replay Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Replay Diagnostic Sequence Button */}
          <button
            type="button"
            onClick={() => setShowBootLoader(true)}
            title="Replay System Diagnostics & Boot Sequence"
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-xs font-mono font-bold text-sky-800 hover:bg-sky-100 transition-all cursor-pointer shadow-xs"
          >
            <span>⚡</span>
            <span>Boot Diagnostics</span>
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
