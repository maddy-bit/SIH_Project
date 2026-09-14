"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { TrajectoryResponseDto, VehicleSummaryDto } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatDistanceKm, formatDurationMinutes, formatTimestamp } from "@/lib/format";
import { TiltCard3D } from "./TiltCard3D";
import { TrajectoryPredictionCard } from "./TrajectoryPredictionCard";

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
  const [activeTab, setActiveTab] = useState<"metrics" | "hologram">("metrics");

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

            {/* View Switcher: Metrics vs 3D Hologram */}
            <div className="mt-3 flex items-center justify-between gap-1.5 rounded-md bg-slate-100 p-1 border border-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab("metrics")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xs py-1.5 px-2 text-xs font-mono uppercase whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "metrics"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-800 hover:bg-slate-200 font-bold"
                }`}
              >
                <span>📊</span>
                <span>Route Telemetry</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hologram")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xs py-1.5 px-2 text-xs font-mono uppercase whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "hologram"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-800 hover:bg-slate-200 font-bold"
                }`}
              >
                <span>🛸</span>
                <span>Wireframe Scan</span>
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
            ) : (
              <div className="mt-3">
                <VehicleHologram3D
                  plate={vehicle.plate}
                  vehicleType={vehicle.vehicleType ?? "SUV"}
                  color={vehicle.color ?? "White"}
                />
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
