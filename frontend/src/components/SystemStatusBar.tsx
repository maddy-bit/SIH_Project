"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCameras, getHealth } from "@/lib/api";

type ConnectionState = "checking" | "online" | "offline";

interface StatusItemProps {
  label: string;
  value: string;
  tone: "neutral" | "positive" | "warning";
}

function StatusItem({ label, value, tone }: StatusItemProps) {
  const dotColor =
    tone === "positive" ? "bg-emerald-400" : tone === "warning" ? "bg-amber-400" : "bg-zinc-500";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-l border-zinc-800 first:border-l-0">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-200">{value}</span>
    </div>
  );
}

export function SystemStatusBar() {
  const [state, setState] = useState<ConnectionState>("checking");
  const [version, setVersion] = useState<string | null>(null);
  const [cameraCounts, setCameraCounts] = useState<{ online: number; processing: number; total: number } | null>(
    null,
  );

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
    const interval = setInterval(checkHealth, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const systemLabel =
    state === "checking" ? "CONNECTING" : state === "online" ? "SYSTEM ONLINE" : "SYSTEM OFFLINE";
  const systemTone = state === "online" ? "positive" : state === "offline" ? "warning" : "neutral";

  return (
    <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-950/60">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center"
        >
          <StatusItem label="Status" value={systemLabel} tone={systemTone} />
        </motion.div>
      </AnimatePresence>
      <StatusItem
        label="Cameras Online"
        value={cameraCounts ? `${cameraCounts.online} / ${cameraCounts.total}` : "— / —"}
        tone="neutral"
      />
      <StatusItem
        label="Cameras Processing"
        value={cameraCounts ? String(cameraCounts.processing) : "—"}
        tone="neutral"
      />
      <StatusItem label="Active Investigations" value="0" tone="neutral" />
      {version && <StatusItem label="Backend" value={`v${version}`} tone="neutral" />}
    </div>
  );
}
