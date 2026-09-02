"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAnalyticsOverview, type AnalyticsOverviewDto } from "@/lib/api";

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums text-zinc-50">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}

function BarRow({ label, count, max, accent = "bg-sky-500" }: { label: string; count: number; max: number; accent?: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="truncate text-zinc-300">{label}</span>
        <span className="tabular-nums text-zinc-500">{count}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${accent}`}
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
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-sm text-zinc-500">Loading city traffic summary…</div>;
  }

  const hourMax = Math.max(1, ...data.detectionsByHour.map((h) => h.count));
  const typeMax = Math.max(1, ...data.vehicleTypeDistribution.map((t) => t.count));
  const cameraMax = Math.max(1, ...data.busiestCameras.map((c) => c.count));
  const routeMax = Math.max(1, ...data.topRoutes.map((r) => r.count));

  return (
    <div className="flex-1 p-4">
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card title="Cameras">
          <BigStat label={`${data.camerasOnline} online / ${data.totalCameras} total`} value={data.totalCameras} />
        </Card>
        <Card title="Processing">
          <BigStat label="cameras processing" value={data.camerasProcessing} />
        </Card>
        <Card title="Offline">
          <BigStat label="cameras offline" value={data.camerasOffline} />
        </Card>
        <Card title="Tracked Vehicles">
          <BigStat label="distinct plates matched" value={data.totalVehicles} />
        </Card>
        <Card title="Total Detections">
          <BigStat label="stored AI detections" value={data.totalDetections} />
        </Card>
        <Card title="Avg. Travel Speed">
          <BigStat
            label="across scored transitions"
            value={data.averageTransitionSpeedKmh != null ? `${data.averageTransitionSpeedKmh.toFixed(0)} km/h` : "—"}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Detections by Hour">
          {data.detectionsByHour.length === 0 ? (
            <p className="text-xs text-zinc-600">No data yet.</p>
          ) : (
            data.detectionsByHour.map((h) => (
              <BarRow key={h.hour} label={`${String(h.hour).padStart(2, "0")}:00`} count={h.count} max={hourMax} />
            ))
          )}
        </Card>

        <Card title="Vehicle Type Distribution">
          {data.vehicleTypeDistribution.length === 0 ? (
            <p className="text-xs text-zinc-600">No data yet.</p>
          ) : (
            data.vehicleTypeDistribution.map((t) => (
              <BarRow key={t.vehicleType} label={t.vehicleType} count={t.count} max={typeMax} accent="bg-emerald-500" />
            ))
          )}
        </Card>

        <Card title="Busiest Cameras">
          {data.busiestCameras.length === 0 ? (
            <p className="text-xs text-zinc-600">No data yet.</p>
          ) : (
            data.busiestCameras.map((c) => (
              <BarRow key={c.cameraId} label={`${c.cameraId} — ${c.cameraName}`} count={c.count} max={cameraMax} accent="bg-amber-500" />
            ))
          )}
        </Card>

        <Card title="Common Origins">
          {data.commonOrigins.length === 0 ? (
            <p className="text-xs text-zinc-600">Not enough multi-camera trajectories yet.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {data.commonOrigins.map((o) => (
                <li key={o.cameraId} className="flex justify-between">
                  <span>{o.cameraId} — {o.cameraName}</span>
                  <span className="tabular-nums text-zinc-500">{o.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Common Destinations">
          {data.commonDestinations.length === 0 ? (
            <p className="text-xs text-zinc-600">Not enough multi-camera trajectories yet.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {data.commonDestinations.map((d) => (
                <li key={d.cameraId} className="flex justify-between">
                  <span>{d.cameraId} — {d.cameraName}</span>
                  <span className="tabular-nums text-zinc-500">{d.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Top Routes (Origin → Destination pairs)">
          {data.topRoutes.length === 0 ? (
            <p className="text-xs text-zinc-600">Not enough multi-camera trajectories yet.</p>
          ) : (
            data.topRoutes.map((r) => (
              <BarRow
                key={`${r.fromCameraId}-${r.toCameraId}`}
                label={`${r.fromCameraId} → ${r.toCameraId}`}
                count={r.count}
                max={routeMax}
                accent="bg-violet-500"
              />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
