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

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-300 border border-black text-black font-black";
      case "HIGH":
        return "bg-amber-300 border border-black text-black font-black";
      case "MEDIUM":
        return "bg-[#facc15] border border-black text-black font-black";
      default:
        return "bg-neutral-200 border border-black text-black font-bold";
    }
  };

  return (
    <div className="neo-box overflow-hidden">
      <div className="neo-header">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="bg-amber-400 text-slate-950 font-mono font-bold text-xs px-2.5 py-0.5 rounded-xs shrink-0">
            ALERTS
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("alerts")}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xs transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === "alerts"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-900 hover:bg-slate-100 border-slate-300"
            }`}
          >
            Alerts ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("watchlist")}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xs transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === "watchlist"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-900 hover:bg-slate-100 border-slate-300"
            }`}
          >
            Watchlist ({watchlist.length})
          </button>
        </div>
      </div>

      <div className="p-3.5 max-h-60 overflow-y-auto">
        {activeTab === "alerts" ? (
          alerts.length === 0 ? (
            <p className="text-xs text-slate-800 font-mono italic font-semibold">No security alerts triggered. Surveillance clear.</p>
          ) : (
            alerts.map((a, idx) => (
              <div key={a.alertId || idx} className="mb-2 rounded-md border border-slate-300 bg-white p-2 text-xs">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono font-bold text-slate-950 text-xs">{a.alertType}</span>
                  <span className={`rounded-xs px-1.5 py-0.5 text-[9px] font-mono font-bold shrink-0 ${getSeverityBadge(a.severity)}`}>
                    {a.severity}
                  </span>
                </div>
                <p className="mt-1 text-slate-800 font-medium leading-tight text-[10px] sm:text-[11px]">{a.description}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-700 font-mono font-bold border-t border-slate-200 pt-1">
                  <span>Plate: <strong className="text-slate-950 font-bold">{a.plateNumber}</strong></span>
                  <span>Node: <strong className="text-slate-950 font-bold">{a.cameraId}</strong></span>
                </div>
              </div>
            ))
          )
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">Registered Targets</span>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="rounded-xs bg-amber-400 px-3 py-1.5 text-xs font-mono font-bold text-slate-950 border border-amber-500 hover:bg-amber-500 transition-all cursor-pointer"
              >
                {showAddForm ? "Cancel" : "+ Add Target Plate"}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddEntry} className="rounded-md border border-slate-300 bg-white p-3.5 text-sm space-y-2.5">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter License Plate (e.g. MH15TC554)"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 p-2.5 font-mono text-sm font-bold text-slate-950 uppercase focus:border-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="rounded-md border border-slate-300 bg-slate-50 p-2 text-xs font-bold text-slate-900"
                  >
                    <option value="HIGH_VALUE_STOLEN_VEHICLE">Stolen Vehicle</option>
                    <option value="SUSPECT_OF_INTEREST">Suspect of Interest</option>
                    <option value="UNAUTHORIZED_EXPRESSWAY_ACCESS">Unauthorized Access</option>
                    <option value="CLONED_PLATE_ALERT">Cloned Plate Suspect</option>
                  </select>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW")}
                    className="rounded-md border border-slate-300 bg-slate-50 p-2 text-xs text-rose-700 font-bold"
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
                  className="w-full rounded-md bg-slate-900 py-2.5 text-xs sm:text-sm font-bold uppercase text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  {isSubmitting ? "Registering..." : "Register Watchlist Target"}
                </button>
              </form>
            )}

            {watchlist.length === 0 ? (
              <p className="text-sm text-slate-800 italic font-semibold">No watchlisted plates registered.</p>
            ) : (
              watchlist.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md bg-white p-3 text-sm border border-slate-300">
                  <span className="font-mono font-bold text-slate-950 text-sm">{w.plateNumber}</span>
                  <span className="text-slate-900 text-xs sm:text-sm font-bold">{w.reason}</span>
                  <span className={`rounded-xs border px-2.5 py-0.5 text-xs font-mono font-bold ${getSeverityBadge(w.severity)}`}>
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
