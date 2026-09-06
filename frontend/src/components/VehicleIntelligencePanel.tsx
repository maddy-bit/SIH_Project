"use client";

import { useState } from "react";
import type { TrajectoryResponseDto, VehicleSummaryDto } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatDistanceKm, formatDurationMinutes, formatTimestamp } from "@/lib/format";
import { TiltCard3D } from "./TiltCard3D";
import { VehicleHologram3D } from "./VehicleHologram3D";

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
      className={`rounded-2xl border p-3 transition-all ${
        highlight
          ? "border-sky-300 bg-sky-50/80 shadow-xs"
          : "border-slate-200/90 bg-slate-50/80 shadow-inner"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {icon && <span className="text-sm">{icon}</span>}
      </div>
      <div className="mt-1 text-sm font-mono font-black text-slate-900 truncate">
        {value ?? "—"}
      </div>
      {subtext && <div className="mt-0.5 text-[9px] font-mono text-slate-500">{subtext}</div>}
    </div>
  );
}

export function VehicleIntelligencePanel({ summary, trajectory }: VehicleIntelligencePanelProps) {
  const { vehicle } = summary;
  const overallConf = trajectory?.overallConfidence;
  const [activeTab, setActiveTab] = useState<"metrics" | "hologram">("metrics");

  return (
    <TiltCard3D maxTilt={4} scale={1.01}>
      <div className="card-3d-light relative rounded-2xl p-5 text-slate-900 overflow-hidden">
        {/* Tactical HUD Corner Reticles */}
        <div className="pointer-events-none absolute top-2 left-2 h-2.5 w-2.5 border-t-2 border-l-2 border-sky-400" />
        <div className="pointer-events-none absolute top-2 right-2 h-2.5 w-2.5 border-t-2 border-r-2 border-sky-400" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 border-b-2 border-l-2 border-sky-400" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 border-b-2 border-r-2 border-sky-400" />

        {/* Target Plate Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 font-mono text-sm font-black tracking-widest text-slate-900 shadow-xs">
              <span className="mr-1.5 text-[9px] text-blue-600 font-black">IND</span>
              {vehicle.plate}
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">
                {vehicle.make ? `${vehicle.make} ${vehicle.model ?? ""}` : "Unclassified Vehicle"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {vehicle.color ?? "Unknown"} • {vehicle.vehicleType ?? "Vehicle"}
              </div>
            </div>
          </div>

          {overallConf != null && (
            <div className="flex flex-col items-end">
              <ConfidenceBadge value={overallConf} label="Route Score" size="md" />
            </div>
          )}
        </div>

        {/* View Switcher: Metrics vs 3D Hologram */}
        <div className="mt-3 flex items-center justify-between gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("metrics")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
              activeTab === "metrics"
                ? "bg-white text-sky-800 shadow-xs border border-sky-300"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📊</span>
            <span>Route Telemetry</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hologram")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
              activeTab === "hologram"
                ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🛸</span>
            <span>3D Wireframe Scan</span>
          </button>
        </div>

        {/* Content Tabs */}
        {activeTab === "metrics" ? (
          <>
            {/* Primary 3D Telemetry Grid */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <StatTile
                label="Est. Route Distance"
                value={trajectory ? formatDistanceKm(trajectory.estimatedDistanceKm) : "—"}
                subtext="Great-circle & node sum"
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
                subtext="Stored AI detections"
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
              <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 shadow-sm">
                <span className="text-amber-600 text-sm font-bold">⚠</span>
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] block text-amber-900">
                    Kinematic Note:
                  </span>
                  {trajectory.warning}
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
    </TiltCard3D>
  );
}
