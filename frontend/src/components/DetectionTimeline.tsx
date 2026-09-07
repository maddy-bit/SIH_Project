"use client";

import { motion } from "framer-motion";
import type { TrajectoryPointDto } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatTimeOnly } from "@/lib/format";
import { TiltCard3D } from "./TiltCard3D";

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
    <TiltCard3D maxTilt={4} scale={1.01}>
      <div className="card-3d-light relative rounded-2xl p-5 text-slate-900 overflow-hidden">
        {/* Tactical HUD Corner Reticles */}
        <div className="pointer-events-none absolute top-2 left-2 h-2.5 w-2.5 border-t-2 border-l-2 border-sky-400" />
        <div className="pointer-events-none absolute top-2 right-2 h-2.5 w-2.5 border-t-2 border-r-2 border-sky-400" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 border-b-2 border-l-2 border-sky-400" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 border-b-2 border-r-2 border-sky-400" />

        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500 shadow-xs animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-800">
              Detection Timeline
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md shadow-xs">
            {points.length} Checkpoints
          </span>
        </div>

        <div className="mt-4 flex flex-col">
          {points.map((point, i) => {
            const isSelected = selectedIndex === i;

            return (
              <div key={`${point.cameraId}-${point.timestamp}`} className="relative">
                {/* Inter-node connector track with travel delta */}
                {i > 0 && (
                  <div className="flex items-center gap-2.5 py-2 pl-4 text-[11px] text-slate-500 font-mono">
                    <div className="h-5 w-0.5 bg-gradient-to-b from-sky-400 to-slate-200 shadow-xs" />
                    <span className="text-sky-700 font-bold">
                      ↓ {gapLabel(points[i - 1].timestamp, point.timestamp)}
                    </span>
                    {point.incomingTransitionConfidence != null && (
                      <ConfidenceBadge value={point.incomingTransitionConfidence} label="Match" />
                    )}
                  </div>
                )}

                {/* Checkpoint Node Card */}
                <motion.button
                  type="button"
                  onClick={() => onSelect(i)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.01 }}
                  className={`group flex w-full items-start gap-3.5 rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 shadow-md ring-1 ring-sky-300"
                      : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {/* Number Badge */}
                  <div
                    className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border font-mono text-xs font-black shadow-xs ${
                      isSelected
                        ? "border-sky-600 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25"
                        : "border-sky-300 bg-sky-50 text-sky-800"
                    }`}
                  >
                    {i + 1}
                  </div>

                  {/* Node Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-slate-950 group-hover:text-sky-700 transition-colors">
                        {point.cameraId}
                      </span>
                      <span className="font-mono text-[11px] font-extrabold text-slate-700">
                        {formatTimeOnly(point.timestamp)}
                      </span>
                    </div>

                    <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-800">
                      {point.cameraName}
                    </div>

                    {/* Confidence pills */}
                    <div className="mt-2 flex items-center gap-3">
                      {point.plateConfidence != null && (
                        <span className="text-[10px] font-mono text-slate-700 font-medium">
                          OCR:{" "}
                          <span className="text-emerald-800 font-extrabold">
                            {Math.round(point.plateConfidence * 100)}%
                          </span>
                        </span>
                      )}
                      {point.detectionConfidence != null && (
                        <span className="text-[10px] font-mono text-slate-700 font-medium">
                          Det:{" "}
                          <span className="text-sky-800 font-extrabold">
                            {Math.round(point.detectionConfidence * 100)}%
                          </span>
                        </span>
                      )}
                    </div>

                    {point.transitionNote && (
                      <div className="mt-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-[10px] font-bold text-rose-700">
                        ⚠ {point.transitionNote}
                      </div>
                    )}
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    </TiltCard3D>
  );
}
