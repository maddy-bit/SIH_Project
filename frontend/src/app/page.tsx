"use client";

import { useState } from "react";
import { SystemStatusBar } from "@/components/SystemStatusBar";
import { InvestigationDashboard } from "@/components/InvestigationDashboard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

type View = "investigation" | "analytics";

export default function DashboardPage() {
  const [view, setView] = useState<View>("investigation");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">SIH26127</p>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              City AI Traffic Intelligence
            </h1>
          </div>
          <nav className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950/60 p-1">
            {(
              [
                { value: "investigation", label: "Investigation" },
                { value: "analytics", label: "City Traffic Summary" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setView(tab.value)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === tab.value
                    ? "bg-sky-500/15 text-sky-300"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <SystemStatusBar />
      </header>

      {view === "investigation" ? <InvestigationDashboard /> : <AnalyticsDashboard />}
    </div>
  );
}
