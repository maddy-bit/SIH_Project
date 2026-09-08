"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAnalyticsOverview, type AnalyticsOverviewDto } from "@/lib/api";

import { TiltCard3D } from "./TiltCard3D";

function StatCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TiltCard3D maxTilt={4} scale={1.01}>
      <div
        className={`card-3d-light relative rounded-2xl p-5 transition-all duration-300 overflow-hidden ${className}`}
      >
        {/* Tactical HUD Corner Reticles */}
        <div className="pointer-events-none absolute top-2 left-2 h-2 w-2 border-t-2 border-l-2 border-sky-400/80" />
        <div className="pointer-events-none absolute top-2 right-2 h-2 w-2 border-t-2 border-r-2 border-sky-400/80" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-2 w-2 border-b-2 border-l-2 border-sky-400/80" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b-2 border-r-2 border-sky-400/80" />

        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h2>
          <span className="h-2 w-2 rounded-full bg-sky-500 shadow-xs animate-pulse" />
        </div>
        <div className="mt-3.5">{children}</div>
      </div>
    </TiltCard3D>
  );
}

function BigStat({
  label,
  value,
  sublabel,
  accent = "text-sky-800",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <div>
      <div className={`text-3xl font-black font-mono tabular-nums tracking-tight ${accent}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
        {label}
      </div>
      {sublabel && (
        <div className="mt-0.5 text-[10px] font-mono text-slate-400">{sublabel}</div>
      )}
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
  accent = "from-sky-500 to-blue-600",
  icon,
}: {
  label: string;
  count: number;
  max: number;
  accent?: string;
  icon?: string;
}) {
  const pct = max > 0 ? Math.max(5, Math.round((count / max) * 100)) : 0;

  return (
    <div className="mb-3.5 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 font-bold text-slate-800">
          {icon && <span className="text-sm">{icon}</span>}
          <span>{label}</span>
        </span>
        <span className="font-mono font-black tabular-nums text-slate-700">{count.toLocaleString()}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${accent}`}
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
        <div className="card-3d-light rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-md">
          <div className="flex items-center gap-2 font-bold mb-1">
            <span>⛔</span>
            <span>ANALYTICS SERVICE UNAVAILABLE</span>
          </div>
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-sm text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <span>COMPILING 3D SMART CITY METRICS…</span>
        </div>
      </div>
    );
  }

  const hourMax = Math.max(1, ...data.detectionsByHour.map((h) => h.count));
  const typeMax = Math.max(1, ...data.vehicleTypeDistribution.map((t) => t.count));
  const cameraMax = Math.max(1, ...data.busiestCameras.map((c) => c.count));

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4">
      {/* Top Telemetry KPI Bar */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Active Surveillance">
          <BigStat
            label="Camera Nodes"
            value={`${data.camerasOnline}/${data.totalCameras}`}
            sublabel="Active Network"
            accent="text-emerald-700"
          />
        </StatCard>

        <StatCard title="Pipeline Streams">
          <BigStat
            label="Processing Feeds"
            value={data.camerasProcessing}
            sublabel="Live Camera Streams"
            accent="text-sky-800"
          />
        </StatCard>

        <StatCard title="Offline Nodes">
          <BigStat
            label="Attention Required"
            value={data.camerasOffline}
            sublabel="No Feed Signal"
            accent={data.camerasOffline > 0 ? "text-amber-700" : "text-slate-400"}
          />
        </StatCard>

        <StatCard title="Identified Targets">
          <BigStat
            label="Unique Plates"
            value={data.totalVehicles.toLocaleString()}
            sublabel="Registered Records"
            accent="text-purple-700"
          />
        </StatCard>

        <StatCard title="Total Detections">
          <BigStat
            label="Inference Logs"
            value={data.totalDetections.toLocaleString()}
            sublabel="Detection Logs"
            accent="text-blue-700"
          />
        </StatCard>

        <StatCard title="Avg Corridor Speed">
          <BigStat
            label="Kinematic Flow"
            value={
              data.averageTransitionSpeedKmh != null
                ? `${data.averageTransitionSpeedKmh.toFixed(0)} km/h`
                : "—"
            }
            sublabel="Corridor Transit"
            accent="text-emerald-700"
          />
        </StatCard>
      </div>

      {/* Main Analytics Content Grids */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Hourly Distribution */}
        <StatCard title="Hourly Traffic Density (24H)" className="lg:col-span-1">
          {data.detectionsByHour.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono py-4">No hourly detection data recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {data.detectionsByHour.map((h) => (
                <BarRow
                  key={h.hour}
                  label={`${String(h.hour).padStart(2, "0")}:00 hrs`}
                  count={h.count}
                  max={hourMax}
                  accent="from-sky-500 to-teal-500"
                />
              ))}
            </div>
          )}
        </StatCard>

        {/* Vehicle Classification Breakdown */}
        <StatCard title="Vehicle Classification" className="lg:col-span-1">
          {data.vehicleTypeDistribution.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono py-4">No vehicle classifications recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
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
                    accent="from-purple-500 to-indigo-600"
                  />
                );
              })}
            </div>
          )}
        </StatCard>

        {/* Busiest Camera Nodes */}
        <StatCard title="High-Density Camera Checkpoints" className="lg:col-span-1">
          {data.busiestCameras.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono py-4">No camera density data recorded.</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {data.busiestCameras.map((c) => (
                <BarRow
                  key={c.cameraId}
                  label={`${c.cameraId} (${c.cameraName})`}
                  count={c.count}
                  max={cameraMax}
                  accent="from-amber-500 to-orange-500"
                />
              ))}
            </div>
          )}
        </StatCard>
      </div>

      {/* Top Corridors & Arterial Routes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatCard title="Most Frequent Traffic Corridors">
          {data.topRoutes.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono py-4">No multi-camera route transitions scored yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.topRoutes.slice(0, 5).map((r, i) => (
                <div
                  key={`${r.fromCameraId}-${r.toCameraId}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-100 text-sky-800 font-mono font-bold text-[10px]">
                      #{i + 1}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{r.fromCameraId}</span>
                    <span className="text-sky-600 font-bold">➔</span>
                    <span className="font-mono font-bold text-slate-900">{r.toCameraId}</span>
                    <span className="text-[11px] text-slate-500">
                      ({r.fromCameraName} to {r.toCameraName})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sky-800">{r.count} Transits</span>
                </div>
              ))}
            </div>
          )}
        </StatCard>

        <StatCard title="Common Origin & Destination Nodes">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-700 mb-2">Top Origin Hubs:</div>
              {data.commonOrigins.length === 0 ? (
                <p className="text-xs text-slate-400 font-mono">No data</p>
              ) : (
                data.commonOrigins.slice(0, 4).map((o) => (
                  <div key={o.cameraId} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                    <span className="font-mono text-slate-700">{o.cameraId}</span>
                    <span className="font-mono text-slate-900 font-bold">{o.count}</span>
                  </div>
                ))
              )}
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-sky-800 mb-2">Top Destination Hubs:</div>
              {data.commonDestinations.length === 0 ? (
                <p className="text-xs text-slate-400 font-mono">No data</p>
              ) : (
                data.commonDestinations.slice(0, 4).map((d) => (
                  <div key={d.cameraId} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                    <span className="font-mono text-slate-700">{d.cameraId}</span>
                    <span className="font-mono text-slate-900 font-bold">{d.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </StatCard>
      </div>
    </div>
  );
}
