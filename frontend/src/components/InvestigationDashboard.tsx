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
import dynamic from "next/dynamic";
import { VehicleSearchPanel, type SearchMode } from "./VehicleSearchPanel";
import { VehicleIntelligencePanel } from "./VehicleIntelligencePanel";
import { DetectionTimeline } from "./DetectionTimeline";
import { EvidenceViewer } from "./EvidenceViewer";
import { LiveCameraGridModal } from "./LiveCameraGridModal";

const InvestigationMap = dynamic(
  () => import("./InvestigationMap").then((mod) => mod.InvestigationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 font-mono text-xs text-sky-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent mb-3" />
        INITIALIZING VECTOR MAP ENGINE...
      </div>
    ),
  }
);

type SearchState = "idle" | "searching" | "found" | "not-found" | "error";
type LiveStatus = "idle" | "connecting" | "streaming" | "complete" | "error";

import { SecurityWatchlistModal } from "./SecurityWatchlistModal";
import { PdfReportExporter } from "./PdfReportExporter";
import { InteractiveTrajectoryPlayer } from "./InteractiveTrajectoryPlayer";
import { VideoIngestionModal } from "./VideoIngestionModal";

export function InvestigationDashboard() {
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<VehicleSummaryDto | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryResponseDto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [replayToken, setReplayToken] = useState(0);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const [isCameraGridOpen, setIsCameraGridOpen] = useState(false);
  const [isVideoIngestOpen, setIsVideoIngestOpen] = useState(false);
  const liveCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    getCameras()
      .then(setCameras)
      .catch(() => {});
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Crisp High-Contrast Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-sky-500 shadow-xs animate-pulse" />
          <span className="text-xs font-mono font-extrabold text-sky-800 tracking-wider">
            3D CITY AI SURVEILLANCE MATRIX
          </span>
          <span className="hidden sm:inline text-xs text-slate-600 font-semibold">
            • 12 Real-Time 4K Video Feeds • YOLOv8 Vehicle Classifiers • EasyOCR Neural Core
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsVideoIngestOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-xs font-mono font-bold text-white shadow-xs hover:from-sky-500 hover:to-blue-500 transition-all cursor-pointer"
          >
            <span>📹</span>
            <span>Ingest CCTV Video Feed</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCameraGridOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-4 py-2 text-xs font-mono font-bold text-sky-800 hover:bg-sky-50 transition-all shadow-xs cursor-pointer"
          >
            <span>🎥</span>
            <span>Live 12-Camera CCTV Matrix</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[350px_1fr_370px] xl:grid-cols-[370px_1fr_390px]">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          <VehicleSearchPanel onSearch={handleSearch} isSearching={searchState === "searching"} />

          <SecurityWatchlistModal />

          <AnimatePresence mode="wait">
            {searchState === "not-found" && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card-3d-light rounded-2xl p-4.5 text-xs text-slate-600 border border-slate-200"
              >
                <div className="flex items-center gap-2 text-amber-700 font-bold mb-1.5">
                  <span>⚠</span>
                  <span>NO TARGET RECORD FOUND</span>
                </div>
                No vehicle detections match this plate string. Try selecting one of the demo targets above.
              </motion.div>
            )}

            {searchState === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card-3d-light rounded-2xl border border-rose-200 bg-rose-50 p-4.5 text-xs text-rose-800 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold mb-1.5">
                  <span>⛔</span>
                  <span>SERVICE RECONNECTION</span>
                </div>
                {errorMessage ?? "Unable to connect to trajectory engine."}
              </motion.div>
            )}

            {searchState === "found" && summary && (
              <motion.div
                key="found"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3.5"
              >
                {isLive && (
                  <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-mono text-sky-800 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-500 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-600" />
                      </span>
                      <span className="font-black">
                        {liveStatus === "connecting" ? "ESTABLISHING WEBSOCKET LINK…" : "LIVE 3D RADAR REPLAY ACTIVE"}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-200 font-bold text-sky-900">LIVE</span>
                  </div>
                )}
                <VehicleIntelligencePanel summary={summary} trajectory={trajectory} />
                <PdfReportExporter summary={summary} trajectory={trajectory} />
              </motion.div>
            )}
          </AnimatePresence>

          {points.length >= 2 && !isLive && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setReplayToken((n) => n + 1)}
              className="btn-3d-light flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-mono font-bold tracking-widest text-white shadow-md uppercase cursor-pointer"
            >
              <span>▶</span>
              <span>Replay 3D Trajectory Route</span>
            </motion.button>
          )}
        </div>

        {/* Center Column: 3D Map & Trajectory Player */}
        <div className="min-h-[480px] flex flex-col gap-4">
          <InvestigationMap
            cameras={cameras}
            points={points}
            selectedIndex={selectedIndex}
            onSelectPoint={setSelectedIndex}
            replayToken={replayToken}
          />
          {points.length > 0 && (
            <InteractiveTrajectoryPlayer
              points={points}
              selectedIndex={selectedIndex}
              onSelectPoint={setSelectedIndex}
            />
          )}
        </div>

        {/* Right Column: Timeline & Forensic CCTV Viewer */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <DetectionTimeline points={points} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
          <EvidenceViewer point={selectedPoint} />
        </div>
      </div>

      {/* 12-Camera Multi-Screen Modal */}
      <LiveCameraGridModal
        isOpen={isCameraGridOpen}
        onClose={() => setIsCameraGridOpen(false)}
        cameras={cameras}
      />

      {/* CCTV Video Feed Ingestion Modal */}
      <VideoIngestionModal
        isOpen={isVideoIngestOpen}
        onClose={() => setIsVideoIngestOpen(false)}
        onTargetDetected={(plate) => handleSearch(plate, "historical")}
      />
    </div>
  );
}
