"use client";

import { useEffect, useState } from "react";
import { getCameras, getHealth } from "@/lib/api";

type ConnectionState = "checking" | "online" | "offline";

interface StatusItemProps {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "cyan";
  icon?: React.ReactNode;
}

function StatusItem({ label, value, tone = "neutral", icon }: StatusItemProps) {
  let dotColor = "bg-slate-400";
  let textColor = "text-slate-900";

  if (tone === "positive") {
    dotColor = "bg-emerald-600";
    textColor = "text-emerald-900 font-bold";
  } else if (tone === "warning") {
    dotColor = "bg-amber-500";
    textColor = "text-amber-900 font-bold";
  } else if (tone === "cyan") {
    dotColor = "bg-slate-700";
    textColor = "text-slate-950 font-bold";
  }

  return (
    <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 border-l border-slate-300 first:border-l-0">
      {icon ? (
        <span className="text-slate-700">{icon}</span>
      ) : (
        <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
      )}
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700">
          {label}
        </span>
        <span className={`text-xs font-mono font-bold ${textColor}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function SystemStatusBar() {
  const [state, setState] = useState<ConnectionState>("checking");
  const [version, setVersion] = useState<string | null>(null);
  const [redisInfo, setRedisInfo] = useState<{ status: string; latency: number | null } | null>(null);
  const [cameraCounts, setCameraCounts] = useState<{ online: number; processing: number; total: number } | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const localStr = now.toLocaleTimeString([], {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(localStr);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const health = await getHealth();
        if (!cancelled) {
          setState("online");
          setVersion(health.version);
          if (health.redisStatus) {
            setRedisInfo({
              status: health.redisStatus,
              latency: health.redisLatencyMs ?? null,
            });
          }
        }
      } catch {
        if (!cancelled) setState("offline");
      }

      try {
        const cameras = await getCameras();
        if (!cancelled) {
          setCameraCounts({
            online: cameras.filter((c) => c.status === "ONLINE").length,
            processing: cameras.filter((c) => c.status === "PROCESSING").length,
            total: cameras.length,
          });
        }
      } catch {
        if (!cancelled) setCameraCounts(null);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 12000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const systemLabel =
    state === "checking" ? "CONNECTING…" : state === "online" ? "ONLINE" : "SIM ACTIVE";

  return (
    <div className="flex items-center rounded-md border-1.5 border-slate-400 bg-white py-1">
      {/* Primary Engine State Indicator */}
      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              state === "online"
                ? "bg-emerald-500"
                : state === "checking"
                ? "bg-amber-400 animate-pulse"
                : "bg-sky-500"
            }`}
          />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700">ENGINE</span>
          <span className="text-xs font-mono font-bold tracking-wide text-slate-950 whitespace-nowrap">
            {systemLabel}
          </span>
        </div>
      </div>

      {/* Surveillance Mesh - Visible on sm and up */}
      <div className="hidden sm:block">
        <StatusItem
          label="Mesh Nodes"
          value={cameraCounts ? `${cameraCounts.online}/${cameraCounts.total}` : "12/12"}
          tone="cyan"
        />
      </div>

      {/* Redis Distributed Cache - Visible on md and up */}
      <div className="hidden md:block">
        <StatusItem
          label="Redis Cache"
          value={
            redisInfo?.status === "UP"
              ? `ONLINE${redisInfo.latency != null ? ` (${redisInfo.latency}ms)` : ""}`
              : redisInfo?.status === "STANDALONE_FALLBACK"
              ? "IN-MEMORY"
              : "READY"
          }
          tone={redisInfo?.status === "UP" ? "positive" : "warning"}
        />
      </div>

      {/* AI Pipeline - Visible on lg and up */}
      <div className="hidden lg:block">
        <StatusItem
          label="Pipeline"
          value={cameraCounts && cameraCounts.processing > 0 ? `${cameraCounts.processing} STREAM` : "STANDBY"}
          tone="neutral"
        />
      </div>

      {/* System Time - Visible on xl and up */}
      <div className="hidden xl:block">
        <StatusItem
          label="Current Time"
          value={currentTime || "00:00:00"}
          tone="neutral"
        />
      </div>

      {/* Core API - Visible on 2xl and up */}
      {version && (
        <div className="hidden 2xl:block">
          <StatusItem label="Core" value={`v${version}`} tone="neutral" />
        </div>
      )}
    </div>
  );
}
