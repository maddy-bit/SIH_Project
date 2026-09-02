"use client";

import { motion } from "framer-motion";
import type { TrajectoryPointDto } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatTimeOnly } from "@/lib/format";

interface DetectionTimelineProps {
  points: TrajectoryPointDto[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

function gapLabel(fromIso: string, toIso: string): string {
  const minutes = Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function DetectionTimeline({ points, selectedIndex, onSelect }: DetectionTimelineProps) {
  if (points.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Detection Timeline</h2>
      <div className="mt-3 flex flex-col">
        {points.map((point, i) => (
          <div key={`${point.cameraId}-${point.timestamp}`}>
            {i > 0 && (
              <div className="flex items-center gap-2 py-1 pl-[13px] text-[11px] text-zinc-600">
                <span>↓</span>
                <span>{gapLabel(points[i - 1].timestamp, point.timestamp)}</span>
                {point.incomingTransitionConfidence != null && (
                  <ConfidenceBadge value={point.incomingTransitionConfidence} label="match" />
                )}
              </div>
            )}
            <motion.button
              type="button"
              onClick={() => onSelect(i)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex w-full items-start gap-3 rounded border px-2.5 py-2 text-left transition-colors ${
                selectedIndex === i
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-transparent hover:border-zinc-700 hover:bg-zinc-800/40"
              }`}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[11px] font-semibold text-sky-300">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-zinc-100">{point.cameraId}</span>
                  <span className="shrink-0 font-mono text-xs text-zinc-500">{formatTimeOnly(point.timestamp)}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-zinc-500">{point.cameraName}</span>
                {point.transitionNote && (
                  <span className="mt-1 block text-[11px] text-rose-300">⚠ {point.transitionNote}</span>
                )}
              </span>
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  );
}
