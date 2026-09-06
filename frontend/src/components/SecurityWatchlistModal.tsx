"use client";

import { useEffect, useState } from "react";
import { getSecurityAlerts, getWatchlist, addWatchlistEntry, type SecurityAlertDto } from "@/lib/api";

export function SecurityWatchlistModal() {
  const [alerts, setAlerts] = useState<SecurityAlertDto[]>([]);
  const [watchlist, setWatchlist] = useState<{ plateNumber: string; reason: string; severity: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"alerts" | "watchlist">("alerts");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [newPlate, setNewPlate] = useState("");
  const [newReason, setNewReason] = useState("HIGH_VALUE_STOLEN_VEHICLE");
  const [newSeverity, setNewSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("CRITICAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getSecurityAlerts().then(setAlerts).catch(() => {});
    getWatchlist().then(setWatchlist).catch(() => {});
  }, []);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!newPlate.trim()) return;

    setIsSubmitting(true);
    const formattedPlate = newPlate.toUpperCase().replace(/\s+/g, "");

    try {
      const added = await addWatchlistEntry({
        plateNumber: formattedPlate,
        reason: newReason,
        severity: newSeverity,
      });

      setWatchlist((prev) => [added, ...prev]);
      setNewPlate("");
      setShowAddForm(false);
    } catch {
      setWatchlist((prev) => [{ plateNumber: formattedPlate, reason: newReason, severity: newSeverity }, ...prev]);
      setNewPlate("");
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-300">
            BEL Watchlist & Alert Engine
          </h2>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-zinc-900/80 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("alerts")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "alerts"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Live Alerts ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("watchlist")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === "watchlist"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Watchlist ({watchlist.length})
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-56 overflow-y-auto pr-1">
        {activeTab === "alerts" ? (
          alerts.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">No security alerts triggered. Surveillance clear.</p>
          ) : (
            alerts.map((a, idx) => (
              <div key={a.alertId || idx} className="mb-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-rose-400">{a.alertType}</span>
                  <span className="rounded-md bg-rose-500/30 px-2 py-0.5 text-[10px] text-rose-200 font-mono font-bold">
                    {a.severity}
                  </span>
                </div>
                <p className="mt-1 text-zinc-300">{a.description}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>Plate: <strong className="text-zinc-100 font-mono">{a.plateNumber}</strong></span>
                  <span>Camera: <strong className="text-zinc-100 font-mono">{a.cameraId}</strong></span>
                </div>
              </div>
            ))
          )
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Registered Targets</span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="rounded-lg bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all cursor-pointer"
              >
                {showAddForm ? "Cancel" : "+ Add Target Plate"}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddEntry} className="rounded-xl border border-rose-500/30 bg-zinc-900/90 p-2.5 text-xs space-y-2">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter License Plate (e.g. MH15TC554)"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-1.5 font-mono text-xs text-white uppercase focus:border-rose-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 p-1.5 text-[11px] text-zinc-300"
                  >
                    <option value="HIGH_VALUE_STOLEN_VEHICLE">Stolen Vehicle</option>
                    <option value="SUSPECT_OF_INTEREST">Suspect of Interest</option>
                    <option value="UNAUTHORIZED_EXPRESSWAY_ACCESS">Unauthorized Access</option>
                    <option value="CLONED_PLATE_ALERT">Cloned Plate Suspect</option>
                  </select>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW")}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 p-1.5 text-[11px] text-rose-400 font-bold"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-rose-600 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-all cursor-pointer"
                >
                  {isSubmitting ? "Registering..." : "Register Watchlist Target"}
                </button>
              </form>
            )}

            {watchlist.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No watchlisted plates registered.</p>
            ) : (
              watchlist.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-zinc-900/60 p-2 text-xs border border-zinc-800">
                  <span className="font-mono font-bold text-amber-400">{w.plateNumber}</span>
                  <span className="text-zinc-400 text-[11px]">{w.reason}</span>
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-bold">
                    {w.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
