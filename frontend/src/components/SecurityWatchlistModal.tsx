"use client";

import { useEffect, useState } from "react";
import { getSecurityAlerts, getWatchlist, type SecurityAlertDto } from "@/lib/api";

export function SecurityWatchlistModal() {
  const [alerts, setAlerts] = useState<SecurityAlertDto[]>([]);
  const [watchlist, setWatchlist] = useState<{ plateNumber: string; reason: string; severity: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"alerts" | "watchlist">("alerts");

  useEffect(() => {
    getSecurityAlerts().then(setAlerts).catch(() => {});
    getWatchlist().then(setWatchlist).catch(() => {});
  }, []);

  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse-ring" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-rose-300">
            BEL Surveillance Watchlist & Alert Engine
          </h2>
        </div>

        <div className="flex items-center gap-1 rounded bg-zinc-900/80 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("alerts")}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
              activeTab === "alerts" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Live Alerts ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("watchlist")}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
              activeTab === "watchlist" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Watchlist ({watchlist.length})
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-48 overflow-y-auto pr-1">
        {activeTab === "alerts" ? (
          alerts.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">No security alerts triggered. Surveillance clear.</p>
          ) : (
            alerts.map((a, idx) => (
              <div key={a.alertId || idx} className="mb-2 rounded border border-rose-500/20 bg-rose-500/10 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400">{a.alertType}</span>
                  <span className="rounded bg-rose-500/30 px-1.5 py-0.5 text-[10px] text-rose-200 font-mono">
                    {a.severity}
                  </span>
                </div>
                <p className="mt-1 text-zinc-300">{a.description}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Plate: <strong className="text-zinc-200">{a.plateNumber}</strong></span>
                  <span>Camera: <strong className="text-zinc-200">{a.cameraId}</strong></span>
                </div>
              </div>
            ))
          )
        ) : watchlist.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">No watchlisted plates registered.</p>
        ) : (
          watchlist.map((w, idx) => (
            <div key={idx} className="mb-1.5 flex items-center justify-between rounded bg-zinc-900/60 p-2 text-xs border border-zinc-800">
              <span className="font-mono font-bold text-amber-400">{w.plateNumber}</span>
              <span className="text-zinc-400">{w.reason}</span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                {w.severity}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
