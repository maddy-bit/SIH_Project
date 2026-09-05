"use client";

import { useState, useEffect } from "react";

interface Waypoint {
  cameraId: string;
  timestamp: string;
  transitSpeedKmh?: number | null;
}

interface TrajectoryPlayerProps {
  waypoints: Waypoint[];
  onActiveIndexChange?: (index: number) => void;
}

export function InteractiveTrajectoryPlayer({ waypoints, onActiveIndexChange }: TrajectoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && waypoints.length > 0) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= waypoints.length) {
            setIsPlaying(false);
            return prev;
          }
          if (onActiveIndexChange) onActiveIndexChange(next);
          return next;
        });
      }, 1500 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, waypoints, playbackSpeed, onActiveIndexChange]);

  if (!waypoints || waypoints.length === 0) return null;

  const currentWp = waypoints[currentIndex];

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/80 p-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0);
              if (onActiveIndexChange) onActiveIndexChange(0);
            }}
            className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
          >
            Reset
          </button>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400">
            Step {currentIndex + 1}/{waypoints.length}: <span className="font-semibold text-emerald-400">{currentWp?.cameraId}</span>
          </span>
          <input
            type="range"
            min={0}
            max={waypoints.length - 1}
            value={currentIndex}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCurrentIndex(val);
              if (onActiveIndexChange) onActiveIndexChange(val);
            }}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPlaybackSpeed(s)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                playbackSpeed === s ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
