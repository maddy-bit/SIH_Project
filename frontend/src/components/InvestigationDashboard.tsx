"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ApiError,
  getCameras,
  getVehicleSummary,
  getVehicleTrajectory,
  type CameraDto,
  type TrajectoryResponseDto,
  type VehicleSummaryDto,
} from "@/lib/api";
import { connectLiveTracking } from "@/lib/liveClient";
import { VehicleSearchPanel, type SearchMode } from "./VehicleSearchPanel";
import { VehicleIntelligencePanel } from "./VehicleIntelligencePanel";
import { DetectionTimeline } from "./DetectionTimeline";
import { EvidenceViewer } from "./EvidenceViewer";
import { InvestigationMap } from "./InvestigationMap";

type SearchState = "idle" | "searching" | "found" | "not-found" | "error";
type LiveStatus = "idle" | "connecting" | "streaming" | "complete" | "error";

import { InteractiveTrajectoryPlayer } from "./InteractiveTrajectoryPlayer";
import { SecurityWatchlistModal } from "./SecurityWatchlistModal";
import { PdfReportExporter } from "./PdfReportExporter";

export function InvestigationDashboard() {
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<VehicleSummaryDto | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryResponseDto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const liveCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    getCameras()
      .then(setCameras)
      .catch(() => setCameras([]));
  }, []);

  useEffect(() => {
    return () => liveCleanupRef.current?.();
  }, []);

  function stopLive() {
    liveCleanupRef.current?.();
    liveCleanupRef.current = null;
  }

  function startLive(plate: string, mode: Extract<SearchMode, "live" | "combined">) {
    setLiveStatus("connecting");
    liveCleanupRef.current = connectLiveTracking(plate, {
      onMessage: (message) => {
        if (message.type === "connected") {
          setLiveStatus("streaming");
        } else if (message.type === "detection") {
          if (mode === "live") {
            setTrajectory((prev) =>
              prev
                ? { ...prev, points: [...prev.points, message.point] }
                : {
                    vehicle: summary?.vehicle ?? { plate, vehicleType: null, color: null, make: null, model: null },
                    points: [message.point],
                    overallConfidence: null,
                    estimatedDistanceKm: 0,
                    estimatedDurationMinutes: 0,
                    warning: null,
                  },
            );
          }
          setSelectedIndex(message.index);
        } else if (message.type === "complete") {
          setTrajectory((prev) =>
            prev
              ? {
                  ...prev,
                  overallConfidence: message.overallConfidence,
                  estimatedDistanceKm: message.estimatedDistanceKm,
                  estimatedDurationMinutes: message.estimatedDurationMinutes,
                }
              : prev,
          );
          setLiveStatus("complete");
        } else if (message.type === "error") {
          setLiveStatus("error");
          setErrorMessage(message.message);
        }
      },
      onError: () => setLiveStatus("error"),
    });
  }

  async function handleSearch(plate: string, mode: SearchMode) {
    stopLive();
    setSearchState("searching");
    setErrorMessage(null);
    setSummary(null);
    setTrajectory(null);
    setSelectedIndex(null);
    setLiveStatus("idle");

    try {
      const summaryResult = await getVehicleSummary(plate);
      setSummary(summaryResult);

      if (mode === "historical" || mode === "combined") {
        try {
          const trajectoryResult = await getVehicleTrajectory(plate);
          setTrajectory(trajectoryResult);
          if (trajectoryResult.points.length > 0) setSelectedIndex(0);
        } catch {
          setTrajectory(null);
        }
      }

      setSearchState("found");

      if (mode === "live" || mode === "combined") {
        startLive(plate, mode);
      }
    } catch (err) {
      if (err instanceof ApiError && err.isNotFound) {
        setSearchState("not-found");
      } else {
        setSearchState("error");
        setErrorMessage(err instanceof Error ? err.message : "Search failed");
      }
    }
  }

  const points = trajectory?.points ?? [];
  const selectedPoint = selectedIndex !== null ? points[selectedIndex] ?? null : null;
  const isLive = liveStatus === "connecting" || liveStatus === "streaming";

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr_360px]">
      <div className="flex flex-col gap-4">
        <VehicleSearchPanel onSearch={handleSearch} isSearching={searchState === "searching"} />

        <SecurityWatchlistModal />

        <AnimatePresence mode="wait">
          {searchState === "not-found" && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400"
            >
              No vehicle found for this registration number. It may not have been observed by any camera in the network.
            </motion.div>
          )}
          {searchState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
            >
              {errorMessage ?? "Something went wrong."}
            </motion.div>
          )}
          {searchState === "found" && summary && (
            <motion.div key="found" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
              {isLive && (
                <div className="flex items-center gap-2 rounded border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                  </span>
                  {liveStatus === "connecting" ? "CONNECTING TO LIVE FEED…" : "LIVE — RECEIVING DETECTIONS"}
                </div>
              )}
              <PdfReportExporter summary={summary} trajectory={trajectory} />
              <VehicleIntelligencePanel summary={summary} trajectory={trajectory} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3 min-h-[420px]">
        <div className="flex-1 overflow-hidden rounded-lg border border-zinc-800">
          <InvestigationMap
            cameras={cameras}
            points={points}
            selectedIndex={selectedIndex}
            onSelectPoint={setSelectedIndex}
            replayToken={replayToken}
          />
        </div>
        {points.length > 0 && (
          <InteractiveTrajectoryPlayer
            waypoints={points}
            onActiveIndexChange={(idx) => setSelectedIndex(idx)}
          />
        )}
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto">
        <DetectionTimeline points={points} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <EvidenceViewer point={selectedPoint} />
      </div>
    </div>
  );
}
