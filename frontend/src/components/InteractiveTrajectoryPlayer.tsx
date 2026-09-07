"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import type { TrajectoryPointDto } from "@/lib/api";

export interface Waypoint {
  cameraId: string;
  timestamp: string;
  transitSpeedKmh?: number | null;
}

export interface TrajectoryPlayerProps {
  points?: TrajectoryPointDto[];
  waypoints?: Waypoint[];
  selectedIndex?: number | null;
  onSelectPoint?: ((index: number) => void) | Dispatch<SetStateAction<number | null>>;
  onActiveIndexChange?: (index: number) => void;
}

export function InteractiveTrajectoryPlayer({
  points,
  waypoints,
  selectedIndex,
  onSelectPoint,
  onActiveIndexChange,
}: TrajectoryPlayerProps) {
  // Normalize items from points or waypoints
  const items: Waypoint[] = (points && points.length > 0)
    ? points.map((p) => ({
        cameraId: p.cameraId,
        timestamp: p.timestamp,
        transitSpeedKmh: null,
      }))
    : (waypoints ?? []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [internalIndex, setInternalIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Derive active index during render to avoid cascading renders / setState-in-effect
  const activeIndex =
    selectedIndex != null && selectedIndex >= 0 && selectedIndex < items.length
      ? selectedIndex
      : internalIndex;

  const notifyIndexChange = (index: number) => {
    setInternalIndex(index);
    if (onSelectPoint) {
      (onSelectPoint as (idx: number) => void)(index);
    }
    if (onActiveIndexChange) {
      onActiveIndexChange(index);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && items.length > 0) {
      timer = setInterval(() => {
        setInternalIndex((prev) => {
          const current =
            selectedIndex != null && selectedIndex >= 0 && selectedIndex < items.length
              ? selectedIndex
              : prev;
          const next = current + 1;
          if (next >= items.length) {
            setIsPlaying(false);
            return current;
          }
          if (onSelectPoint) {
            (onSelectPoint as (idx: number) => void)(next);
          }
          if (onActiveIndexChange) {
            onActiveIndexChange(next);
          }
          return next;
        });
      }, 1500 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, items.length, playbackSpeed, selectedIndex, onSelectPoint, onActiveIndexChange]);

  if (items.length === 0) return null;

  const currentWp = items[activeIndex] ?? items[0];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 backdrop-blur-xl shadow-md transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Play / Pause & Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Playback" : "Play Journey"}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs hover:bg-sky-700 transition-colors cursor-pointer text-xs font-bold"
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              notifyIndexChange(0);
            }}
            title="Reset to Start"
            className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Timeline Slider & Checkpoint Indicator */}
        <div className="flex flex-1 items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
            Step {activeIndex + 1}/{items.length}:{" "}
            <span className="font-extrabold text-sky-700">{currentWp?.cameraId}</span>
          </span>
          <input
            type="range"
            min={0}
            max={items.length - 1}
            value={activeIndex}
            onChange={(e) => {
              const val = Number(e.target.value);
              notifyIndexChange(val);
            }}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-sky-600"
          />
        </div>

        {/* Speed Multiplier Controls */}
        <div className="flex items-center gap-1">
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => setPlaybackSpeed(speed)}
              className={`rounded-lg px-2 py-1 text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                playbackSpeed === speed
                  ? "bg-sky-100 text-sky-800 border border-sky-300 font-extrabold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
