"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { TrajectoryResponseDto, VehicleSummaryDto } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatDistanceKm, formatDurationMinutes, formatTimestamp } from "@/lib/format";
import { TiltCard3D } from "./TiltCard3D";
import { TrajectoryPredictionCard } from "./TrajectoryPredictionCard";
import { getVehicleRegistryRecord } from "@/lib/registry";
import { generateRcPdf } from "@/lib/generateRcPdf";

const VehicleHologram3D = dynamic(
  () => import("./VehicleHologram3D").then((mod) => mod.VehicleHologram3D),
  { ssr: false }
);

interface VehicleIntelligencePanelProps {
  summary: VehicleSummaryDto;
  trajectory: TrajectoryResponseDto | null;
}

function StatTile({
  label,
  value,
  subtext,
  icon,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  icon?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-2.5 transition-all ${
        highlight ? "bg-amber-50/80 border-amber-400" : "bg-white border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800">
          {label}
        </span>
        {icon && <span className="text-sm">{icon}</span>}
      </div>
      <div className="mt-1 text-sm font-mono font-bold text-slate-950 truncate">
        {value ?? "—"}
      </div>
      {subtext && <div className="mt-0.5 text-[10px] font-mono font-bold text-slate-700 truncate">{subtext}</div>}
    </div>
  );
}

export function VehicleIntelligencePanel({ summary, trajectory }: VehicleIntelligencePanelProps) {
  const { vehicle } = summary;
  const overallConf = trajectory?.overallConfidence;
  const [activeTab, setActiveTab] = useState<"metrics" | "hologram" | "registry">("metrics");
  const [isDownloading, setIsDownloading] = useState(false);

  const rcRecord = getVehicleRegistryRecord(vehicle.plate);

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadRc = () => {
    setIsDownloading(true);
    try {
      generateRcPdf(rcRecord);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("RC generation failed:", err);
      alert("Failed to generate PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  return (
    <div className="space-y-3.5">
      <TiltCard3D>
        <div className="neo-box overflow-hidden">
          {/* Dedicated Box Header Strip */}
          <div className="neo-header">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 whitespace-nowrap">
              Target Dossier
            </h2>
            <span className="text-xs font-mono font-bold text-slate-800 shrink-0">KINEMATICS</span>
          </div>

          <div className="p-4">
            {/* Target Vehicle Details Header */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-3 gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-base font-bold text-slate-950 uppercase">
                  {vehicle.make ? `${vehicle.make} ${vehicle.model ?? ""}` : "Unclassified Vehicle"}
                </div>
                <div className="text-xs text-slate-800 font-mono font-bold uppercase mt-0.5">
                  {vehicle.color ?? "Unknown"} {vehicle.vehicleType ?? "Vehicle"}
                </div>
              </div>

              {overallConf != null && (
                <div className="flex flex-col items-end shrink-0">
                  <ConfidenceBadge value={overallConf} label="Route Score" size="md" />
                </div>
              )}
            </div>

            {/* View Switcher: Metrics vs 3D Hologram vs VAHAN RC */}
            <div className="mt-3 flex items-center justify-between gap-1 rounded-md bg-slate-100 p-1 border border-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab("metrics")}
                className={`flex-1 flex items-center justify-center gap-1 rounded-xs py-1.5 px-1 text-[11px] font-mono uppercase whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "metrics"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-800 hover:bg-slate-200 font-bold"
                }`}
              >
                <span>📊</span>
                <span>Telemetry</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hologram")}
                className={`flex-1 flex items-center justify-center gap-1 rounded-xs py-1.5 px-1 text-[11px] font-mono uppercase whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "hologram"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-800 hover:bg-slate-200 font-bold"
                }`}
              >
                <span>🛸</span>
                <span>Wireframe</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("registry")}
                className={`flex-1 flex items-center justify-center gap-1 rounded-xs py-1.5 px-1 text-[11px] font-mono uppercase whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "registry"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-800 hover:bg-slate-200 font-bold"
                }`}
              >
                <span>🏛️</span>
                <span>VAHAN RC</span>
              </button>
            </div>

            {/* Content Tabs */}
            {activeTab === "metrics" ? (
              <>
                {/* Primary Telemetry Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <StatTile
                    label="Est. Route Distance"
                    value={trajectory ? formatDistanceKm(trajectory.estimatedDistanceKm) : "—"}
                    subtext="Node summation"
                    icon="📍"
                    highlight
                  />
                  <StatTile
                    label="Est. Travel Duration"
                    value={trajectory ? formatDurationMinutes(trajectory.estimatedDurationMinutes) : "—"}
                    subtext="Cross-camera delta"
                    icon="⏱"
                    highlight
                  />
                  <StatTile
                    label="Cameras Visited"
                    value={`${summary.cameraCount} Distinct Nodes`}
                    subtext={summary.camerasVisited?.join(" → ") || "No nodes"}
                    icon="📹"
                  />
                  <StatTile
                    label="Total Detections"
                    value={`${summary.detectionCount} Snapshots`}
                    subtext="Stored ANPR logs"
                    icon="📸"
                  />
                  <StatTile
                    label="First Identified"
                    value={formatTimestamp(summary.firstSeen)}
                    icon="🟢"
                  />
                  <StatTile
                    label="Last Identified"
                    value={formatTimestamp(summary.lastSeen)}
                    icon="🏁"
                  />
                </div>

                {/* Warning Notification */}
                {trajectory?.warning && (
                  <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950 shadow-xs">
                    <span className="text-amber-700 text-sm font-bold">⚠</span>
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[9px] block text-amber-900 font-mono">
                        Kinematic Warning:
                      </span>
                      <p className="text-[11px] font-medium">{trajectory.warning}</p>
                    </div>
                  </div>
                )}
              </>
            ) : activeTab === "hologram" ? (
              <div className="mt-3">
                <VehicleHologram3D
                  plate={vehicle.plate}
                  vehicleType={vehicle.vehicleType ?? "Sedan"}
                  color={vehicle.color ?? "Silver"}
                />
              </div>
            ) : (
              /* VAHAN RC Spacious View */
              <div className="mt-3 space-y-3 font-mono">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    MoRTH Parivahan Record
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>● {rcRecord.rcStatus}</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Registered Owner */}
                  <div className="rounded-md border border-slate-300 bg-white p-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Registered Owner
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-xs border border-slate-200">
                        {rcRecord.ownerSerial}
                      </span>
                    </div>
                    <div className="mt-1 font-bold text-slate-950 text-sm">
                      {rcRecord.ownerName}
                    </div>
                  </div>

                  {/* Registering Authority */}
                  <div className="rounded-md border border-slate-300 bg-white p-2.5 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">
                      Registering Authority (RTO)
                    </span>
                    <div className="mt-1 font-bold text-slate-950 text-xs leading-relaxed">
                      {rcRecord.registeringAuthority}
                    </div>
                  </div>

                  {/* 2-Column Split: Fuel & Fitness with plenty of space */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-slate-300 bg-white p-2.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">
                        Fuel &amp; Norms
                      </span>
                      <div className="mt-1 font-bold text-slate-950 text-xs">
                        {rcRecord.fuelType}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                        {rcRecord.emissionNorms}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-300 bg-emerald-50/50 p-2.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600 block">
                        Fitness Expiry
                      </span>
                      <div className="mt-1 font-bold text-emerald-800 text-xs">
                        {rcRecord.fitnessUpto}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        15-Yr Validity
                      </div>
                    </div>
                  </div>

                  {/* Financier / Hypothecation */}
                  <div className="rounded-md border border-slate-300 bg-white p-2.5 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">
                      Financier / Hypothecation Bank
                    </span>
                    <div className="mt-1 text-xs font-bold text-slate-800 leading-relaxed">
                      {rcRecord.hypothecationBank}
                    </div>
                  </div>
                </div>

                {/* Prominent Action Button */}
                <button
                  type="button"
                  onClick={handleDownloadRc}
                  disabled={isDownloading}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-sm transition-all ${
                    downloadSuccess
                      ? "bg-emerald-600 text-white"
                      : "neo-btn-accent hover:brightness-105 active:scale-[0.99]"
                  }`}
                >
                  <span className="text-sm">{isDownloading ? "⏳" : downloadSuccess ? "✅" : "📥"}</span>
                  <span>
                    {isDownloading
                      ? "Generating Official RC PDF…"
                      : downloadSuccess
                      ? "RC PDF Downloaded!"
                      : "Download Official Form 23 RC (PDF)"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </TiltCard3D>

      {/* Markov Trajectory Prediction Card */}
      <TrajectoryPredictionCard plate={vehicle.plate} />
    </div>
  );
}
