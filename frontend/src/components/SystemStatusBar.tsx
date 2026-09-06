"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  let textColor = "text-slate-800";

  if (tone === "positive") {
    dotColor = "bg-emerald-500 shadow-[0_0_6px_#10b981]";
    textColor = "text-emerald-700";
  } else if (tone === "warning") {
    dotColor = "bg-amber-500 shadow-[0_0_6px_#f59e0b]";
    textColor = "text-amber-700";
  } else if (tone === "cyan") {
    dotColor = "bg-sky-500 shadow-[0_0_6px_#0284c7]";
    textColor = "text-sky-700";
  }

  return (
    <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 border-l border-slate-200/90 first:border-l-0">
      {icon ? (
        <span className="text-slate-500">{icon}</span>
      ) : (
        <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0 ${dotColor}`} />
      )}
      <div className="flex flex-col leading-tight">
        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className={`text-[11px] font-mono font-bold ${textColor}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function SystemStatusBar() {
  const [state, setState] = useState<ConnectionState>("checking");
  const [version, setVersion] = useState<string | null>(null);
  const [cameraCounts, setCameraCounts] = useState<{ online: number; processing: number; total: number } | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utcStr = now.toISOString().slice(11, 19) + " UTC";
      setCurrentTime(utcStr);
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
    <div className="flex items-center rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-xs py-0.5">
      {/* Primary Engine State Indicator */}
      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1">
        <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500 shadow-xs" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">AI ENGINE</span>
          <span className="text-[11px] font-mono font-bold tracking-wide text-emerald-700 whitespace-nowrap">
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
          label="UTC Time"
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
