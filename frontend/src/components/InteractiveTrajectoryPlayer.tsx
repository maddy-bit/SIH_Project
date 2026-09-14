"use client";

import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from "react";
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

  const activeIndex =
    selectedIndex != null && selectedIndex >= 0 && selectedIndex < items.length
      ? selectedIndex
      : internalIndex;

  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const notifyIndexChange = useCallback(
    (index: number) => {
      setInternalIndex(index);
      if (onSelectPoint) {
        (onSelectPoint as (idx: number) => void)(index);
      }
      if (onActiveIndexChange) {
        onActiveIndexChange(index);
      }
    },
    [onSelectPoint, onActiveIndexChange],
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && items.length > 0) {
      timer = setInterval(() => {
        const next = activeIndexRef.current + 1;
        if (next >= items.length) {
          setIsPlaying(false);
          return;
        }
        notifyIndexChange(next);
      }, 1500 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, items.length, playbackSpeed, notifyIndexChange]);

  if (items.length === 0) return null;

  const currentWp = items[activeIndex] ?? items[0];

  return (
    <div className="rounded-md border-1.5 border-slate-400 bg-white p-3">
      <div className="flex items-center justify-between gap-4">
        {/* Play / Pause & Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Playback" : "Play Journey"}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 active:translate-y-[1px] transition-all cursor-pointer text-xs font-bold"
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
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Timeline Slider & Checkpoint Indicator */}
        <div className="flex flex-1 items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-900 whitespace-nowrap">
            Step {activeIndex + 1}/{items.length}:{" "}
            <span className="bg-slate-100 text-slate-950 border border-slate-300 px-2 py-0.5 rounded-xs font-bold">{currentWp?.cameraId}</span>
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
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
          />
        </div>

        {/* Speed Multiplier Controls */}
        <div className="flex items-center gap-1">
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => setPlaybackSpeed(speed)}
              className={`rounded-xs px-2 py-1 text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                playbackSpeed === speed
                  ? "bg-slate-900 text-white border-slate-900"
                  : "text-slate-800 bg-white hover:bg-slate-100 border-slate-300"
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
