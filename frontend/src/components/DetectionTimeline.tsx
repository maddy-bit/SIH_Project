"use client";

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
  if (points.length === 0) {
    return (
      <TiltCard3D>
        <div className="neo-box overflow-hidden">
          <div className="neo-header">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 whitespace-nowrap">
              Detection Timeline
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-slate-700 font-mono">
            <span className="text-xl mb-1.5">📡</span>
            <span className="font-bold text-slate-900 uppercase tracking-wider">CHRONOLOGICAL TIMELINE STANDBY</span>
            <span className="mt-1 text-[11px] text-slate-700 font-medium">
              Select target plate to populate cross-camera arrival timestamps and transit durations.
            </span>
          </div>
        </div>
      </TiltCard3D>
    );
  }

  return (
    <TiltCard3D>
      <div className="neo-box overflow-hidden">
        {/* Dedicated Box Header Strip */}
        <div className="neo-header">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 whitespace-nowrap">
            Detection Timeline
          </h2>
          <span className="text-[10px] sm:text-xs font-mono font-bold bg-slate-100 text-slate-950 border border-slate-300 px-2 py-0.5 rounded-xs whitespace-nowrap shrink-0">
            {points.length} CHECKPOINTS
          </span>
        </div>

        <div className="p-3.5 flex flex-col space-y-2.5">
          {points.map((point, i) => {
            const isSelected = selectedIndex === i;

            return (
              <div key={`${point.cameraId}-${point.timestamp}`} className="relative">
                {/* Inter-node connector track with travel delta */}
                {i > 0 && (
                  <div className="flex items-center gap-2 py-1.5 pl-4 text-xs text-slate-800 font-mono font-bold">
                    <div className="h-4 w-0.5 bg-slate-400" />
                    <span>↓ {gapLabel(points[i - 1].timestamp, point.timestamp)}</span>
                    {point.incomingTransitionConfidence != null && (
                      <ConfidenceBadge value={point.incomingTransitionConfidence} label="Match" />
                    )}
                  </div>
                )}

                {/* Checkpoint Node Card */}
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className={`group flex w-full items-start gap-3 rounded-md border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-slate-900 bg-slate-100 text-slate-950"
                      : "border-slate-300 bg-white hover:bg-slate-50"
                  }`}
                >
                  {/* Number Badge */}
                  <div className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xs font-mono text-xs font-bold ${
                    isSelected ? "bg-slate-900 text-white" : "bg-slate-700 text-white"
                  }`}>
                    {i + 1}
                  </div>

                  {/* Node Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-slate-950">
                        {point.cameraId}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {formatTimeOnly(point.timestamp)}
                      </span>
                    </div>

                    <div className="mt-0.5 truncate text-xs sm:text-sm font-bold text-slate-900">
                      {point.cameraName}
                    </div>

                    {/* Confidence pills */}
                    <div className="mt-2 flex items-center gap-2">
                      {point.plateConfidence != null && (
                        <span className="text-xs font-mono text-slate-950 font-bold bg-slate-100 px-2 py-0.5 rounded-xs border border-slate-300">
                          OCR: {Math.round(point.plateConfidence * 100)}%
                        </span>
                      )}
                      {point.detectionConfidence != null && (
                        <span className="text-xs font-mono text-slate-950 font-bold bg-slate-100 px-2 py-0.5 rounded-xs border border-slate-300">
                          DET: {Math.round(point.detectionConfidence * 100)}%
                        </span>
                      )}
                    </div>

                    {point.transitionNote && (
                      <div className="mt-1.5 rounded-xs bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-800 font-mono">
                        ⚠ {point.transitionNote}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </TiltCard3D>
  );
}
