"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAnalyticsOverview, type AnalyticsOverviewDto } from "@/lib/api";

import { TiltCard3D } from "./TiltCard3D";

function StatCard({
  title,
  colTag,
  children,
  className = "",
}: {
  title: string;
  colTag?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TiltCard3D>
      <div className={`neo-box overflow-hidden ${className}`}>
        {/* Dedicated Box Header Strip */}
        <div className="neo-header">
          <div className="flex items-center gap-2">
            {colTag && (
              <span className="bg-slate-800 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-xs">
                {colTag}
              </span>
            )}
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-950">{title}</h2>
          </div>
          <span className="h-2 w-2 rounded-full bg-slate-400" />
        </div>
        <div className="p-4">{children}</div>
      </div>
    </TiltCard3D>
  );
}

function BigStat({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-1 text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
        {label}
      </div>
      {sublabel && (
        <div className="mt-0.5 text-[11px] font-mono font-bold text-slate-800">{sublabel}</div>
      )}
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
  icon,
}: {
  label: string;
  count: number;
  max: number;
  icon?: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
        <span className="flex items-center gap-1.5 font-bold text-slate-950 font-mono">
          {icon && <span className="text-sm">{icon}</span>}
          <span>{label}</span>
        </span>
        <span className="font-mono font-bold tabular-nums text-slate-950 bg-slate-100 px-2.5 py-0.5 rounded-xs border border-slate-300 text-xs sm:text-sm">
          {count.toLocaleString()}
        </span>
      </div>
      {/* Clean refined progress bar with dark slate fill */}
      <div className="h-2.5 w-full overflow-hidden rounded-xs bg-slate-100 border border-slate-300">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-slate-800 rounded-none"
        />
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsOverviewDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalyticsOverview()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analytics"));
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="neo-box bg-rose-100 p-6 text-sm text-black">
          <div className="flex items-center gap-2 font-mono font-black mb-1">
            <span>⛔</span>
            <span>ANALYTICS SERVICE UNAVAILABLE</span>
          </div>
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-xs text-neutral-600 font-mono">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <span className="font-black">COMPILING SMART CITY METRICS…</span>
        </div>
      </div>
    );
  }

  const hourMax = Math.max(1, ...data.detectionsByHour.map((h) => h.count));
  const typeMax = Math.max(1, ...data.vehicleTypeDistribution.map((t) => t.count));
  const cameraMax = Math.max(1, ...data.busiestCameras.map((c) => c.count));

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5">
      {/* Top Telemetry KPI Bar - 6 Clear Metric Tiles */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Active Surveillance">
          <BigStat
            label="Camera Nodes"
            value={`${data.camerasOnline}/${data.totalCameras}`}
            sublabel="Surveillance Mesh"
          />
        </StatCard>

        <StatCard title="Pipeline Streams">
          <BigStat
            label="Processing Feeds"
            value={data.camerasProcessing}
            sublabel="Live Ingestion"
          />
        </StatCard>

        <StatCard title="Offline Nodes">
          <BigStat
            label="Maintenance"
            value={data.camerasOffline}
            sublabel={data.camerasOffline > 0 ? "Attention Required" : "All Operational"}
          />
        </StatCard>

        <StatCard title="Target Catalog">
          <BigStat
            label="Unique Plates"
            value={data.totalVehicles.toLocaleString()}
            sublabel="OCR Recognized"
          />
        </StatCard>

        <StatCard title="Total Detections">
          <BigStat
            label="Inference Logs"
            value={data.totalDetections.toLocaleString()}
            sublabel="Timestamped Frames"
          />
        </StatCard>

        <StatCard title="Corridor Velocity">
          <BigStat
            label="Kinematic Flow"
            value={
              data.averageTransitionSpeedKmh != null
                ? `${data.averageTransitionSpeedKmh.toFixed(0)} km/h`
                : "—"
            }
            sublabel="Inter-Node Average"
          />
        </StatCard>
      </div>

      {/* Main Analytics Content Grids - 3 Clearly Differentiated Columns */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Column 1: Hourly Distribution */}
        <StatCard title="Hourly Traffic Density (24H)" className="lg:col-span-1">
          {data.detectionsByHour.length === 0 ? (
            <p className="text-xs text-neutral-500 font-mono py-4">No hourly detection data recorded yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {data.detectionsByHour.map((h) => (
                <BarRow
                  key={h.hour}
                  label={`${String(h.hour).padStart(2, "0")}:00 hrs`}
                  count={h.count}
                  max={hourMax}
                />
              ))}
            </div>
          )}
        </StatCard>

        {/* Column 2: Vehicle Classification Breakdown */}
        <StatCard title="Vehicle Classification" className="lg:col-span-1">
          {data.vehicleTypeDistribution.length === 0 ? (
            <p className="text-xs text-neutral-500 font-mono py-4">No vehicle classifications recorded yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {data.vehicleTypeDistribution.map((t) => {
                const icon =
                  t.vehicleType?.toLowerCase() === "suv"
                    ? "🚙"
                    : t.vehicleType?.toLowerCase() === "truck"
                    ? "🚛"
                    : t.vehicleType?.toLowerCase() === "bus"
                    ? "🚌"
                    : t.vehicleType?.toLowerCase() === "motorcycle" || t.vehicleType?.toLowerCase() === "bike"
                    ? "🏍️"
                    : "🚗";

                return (
                  <BarRow
                    key={t.vehicleType}
                    label={t.vehicleType || "Unclassified"}
                    count={t.count}
                    max={typeMax}
                    icon={icon}
                  />
                );
              })}
            </div>
          )}
        </StatCard>

        {/* Column 3: Busiest Camera Nodes */}
        <StatCard title="High-Density Camera Checkpoints" className="lg:col-span-1">
          {data.busiestCameras.length === 0 ? (
            <p className="text-xs text-neutral-500 font-mono py-4">No camera density data recorded.</p>
          ) : (
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {data.busiestCameras.map((c) => (
                <BarRow
                  key={c.cameraId}
                  label={`${c.cameraId} (${c.cameraName})`}
                  count={c.count}
                  max={cameraMax}
                />
              ))}
            </div>
          )}
        </StatCard>
      </div>

      {/* Secondary Analytics Content Grids - 2 Clearly Differentiated Columns */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Column 4: Top Corridors */}
        <StatCard title="Most Frequent Traffic Corridors">
          {data.topRoutes.length === 0 ? (
            <p className="text-xs text-slate-700 font-mono py-4">No multi-camera route transitions scored yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topRoutes.slice(0, 5).map((r, i) => (
                <div
                  key={`${r.fromCameraId}-${r.toCameraId}`}
                  className="flex items-center justify-between rounded-md border border-slate-300 bg-white p-3 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-slate-900 text-white font-mono font-bold text-xs">
                      #{i + 1}
                    </span>
                    <span className="font-mono font-bold text-slate-950 text-sm">{r.fromCameraId}</span>
                    <span className="font-bold text-slate-500">➔</span>
                    <span className="font-mono font-bold text-slate-950 text-sm">{r.toCameraId}</span>
                    <span className="text-xs text-slate-800 font-mono font-bold hidden sm:inline">
                      ({r.fromCameraName} to {r.toCameraName})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-950 bg-slate-100 px-3 py-1 border border-slate-300 rounded-xs text-xs sm:text-sm">
                    {r.count} Transits
                  </span>
                </div>
              ))}
            </div>
          )}
        </StatCard>

        {/* Column 5: Common Origin & Destination Nodes */}
        <StatCard title="Common Origin & Destination Nodes">
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-300 bg-white p-3.5 rounded-md">
              <div className="text-xs font-mono uppercase font-bold text-slate-950 bg-slate-100 px-3 py-1 border border-slate-300 rounded-xs mb-3 inline-block">
                Top Origin Hubs
              </div>
              {data.commonOrigins.length === 0 ? (
                <p className="text-sm text-slate-800 font-mono font-bold">No data</p>
              ) : (
                <div className="space-y-2">
                  {data.commonOrigins.slice(0, 4).map((o) => (
                    <div key={o.cameraId} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-200 last:border-b-0 font-mono">
                      <span className="font-bold text-slate-950">{o.cameraId}</span>
                      <span className="font-bold text-slate-950 bg-slate-100 px-2.5 py-0.5 border border-slate-300 rounded-xs text-xs">{o.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-300 bg-white p-3.5 rounded-md">
              <div className="text-xs font-mono uppercase font-bold text-slate-950 bg-slate-100 px-3 py-1 border border-slate-300 rounded-xs mb-3 inline-block">
                Top Destination Hubs
              </div>
              {data.commonDestinations.length === 0 ? (
                <p className="text-sm text-slate-800 font-mono font-bold">No data</p>
              ) : (
                <div className="space-y-2">
                  {data.commonDestinations.slice(0, 4).map((d) => (
                    <div key={d.cameraId} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-200 last:border-b-0 font-mono">
                      <span className="font-bold text-slate-950">{d.cameraId}</span>
                      <span className="font-bold text-slate-950 bg-slate-100 px-2.5 py-0.5 border border-slate-300 rounded-xs text-xs">{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </StatCard>
      </div>
    </div>
  );
}
