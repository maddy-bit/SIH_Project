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
import { VehicleRegistrySection } from "./VehicleRegistrySection";
import { VehicleRegistryModal } from "./VehicleRegistryModal";

export function InvestigationDashboard() {
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<VehicleSummaryDto | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryResponseDto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [replayToken] = useState(0);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const [isCameraGridOpen, setIsCameraGridOpen] = useState(false);
  const [isVideoIngestOpen, setIsVideoIngestOpen] = useState(false);
  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);
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

  async function handleSearch(
    plate: string,
    mode: SearchMode,
    overrideVehicleType?: string,
    overrideColor?: string,
  ) {
    stopLive();
    setSearchState("searching");
    setErrorMessage(null);
    setSummary(null);
    setTrajectory(null);
    setSelectedIndex(null);
    setLiveStatus("idle");

    try {
      const summaryResult = await getVehicleSummary(plate);
      if (overrideVehicleType) {
        summaryResult.vehicle.vehicleType = overrideVehicleType;
      }
      if (overrideColor) {
        summaryResult.vehicle.color = overrideColor;
      }
      setSummary(summaryResult);

      if (mode === "historical" || mode === "combined") {
        try {
          const trajectoryResult = await getVehicleTrajectory(plate);
          if (overrideVehicleType) {
            trajectoryResult.vehicle.vehicleType = overrideVehicleType;
          }
          if (overrideColor) {
            trajectoryResult.vehicle.color = overrideColor;
          }
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
      {/* Sharp Neo-Brutalist Action Strip */}
      <div className="neo-box p-3 sm:px-4 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
          <span className="text-sm sm:text-base font-mono font-bold text-slate-950 tracking-wide uppercase">
            Active Multi-Camera Tracking
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsVideoIngestOpen(true)}
            className="neo-btn-accent flex items-center gap-2 px-4 py-2.5 text-sm font-mono font-bold uppercase cursor-pointer"
          >
            <span>📹</span>
            <span>Ingest Video Feed</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCameraGridOpen(true)}
            className="neo-btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm font-mono font-bold uppercase cursor-pointer"
          >
            <span>🎥</span>
            <span>12-Camera Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRegistryModalOpen(true)}
            className="neo-btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm font-mono font-bold uppercase cursor-pointer"
          >
            <span>🏛️</span>
            <span>VAHAN Registry</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_1fr_360px] xl:grid-cols-[380px_1fr_380px]">
        {/* Left Column: Target Search & Surveillance Controls */}
        <div className="flex flex-col gap-4">
          <VehicleSearchPanel onSearch={handleSearch} isSearching={searchState === "searching"} />

          <SecurityWatchlistModal />

          <AnimatePresence mode="wait">
            {searchState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="neo-box p-4 bg-white"
              >
                <div className="flex items-center gap-2 text-slate-950 font-bold text-base mb-1.5 uppercase tracking-wide">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-slate-700" />
                  <span>Ready for Target Input</span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  Enter a vehicle registration number above or choose a preset scenario, then click <strong className="text-slate-950 font-bold font-mono">⚡ Reconstruct 3D Trajectory</strong> to begin multi-camera tracking.
                </p>
              </motion.div>
            )}

            {searchState === "not-found" && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="neo-box p-4 border border-slate-300"
              >
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-1">
                  <span>⚠</span>
                  <span className="uppercase tracking-wide font-mono">TARGET RECORD NOT FOUND</span>
                </div>
                <p className="text-sm text-slate-700 font-medium">
                  No camera detections match this plate string. Try selecting one of the preset targets above.
                </p>
              </motion.div>
            )}

            {searchState === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="neo-box bg-rose-50 p-4 border border-rose-300"
              >
                <div className="flex items-center gap-2 font-bold mb-1 font-mono text-sm text-rose-700">
                  <span>⛔</span>
                  <span>ENGINE RECONNECTION</span>
                </div>
                <p className="font-medium text-sm text-rose-800">{errorMessage ?? "Unable to connect to trajectory engine."}</p>
              </motion.div>
            )}

            {searchState === "found" && summary && (
              <motion.div
                key="found"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3.5"
              >
                {isLive && (
                  <div className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm font-mono font-bold text-amber-950">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </span>
                      <span>
                        {liveStatus === "connecting" ? "CONNECTING WEBSOCKET…" : "LIVE RADAR REPLAY ACTIVE"}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-xs bg-amber-500 text-black font-black">LIVE</span>
                  </div>
                )}
                <VehicleIntelligencePanel summary={summary} trajectory={trajectory} />
                <PdfReportExporter summary={summary} trajectory={trajectory} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center Column: 3D Map, Trajectory Player & VAHAN Vehicle Registry */}
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
          {summary && (
            <VehicleRegistrySection plateNumber={summary.vehicle.plate} />
          )}
        </div>

        {/* Right Column: Timeline & Forensic CCTV Viewer */}
        <div className="flex flex-col gap-4 overflow-y-auto p-1 -m-1">
          <DetectionTimeline points={points} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
          <EvidenceViewer
            point={selectedPoint}
            targetPlate={summary?.vehicle.plate ?? "MH12AB1234"}
            vehicleType={summary?.vehicle.vehicleType ?? trajectory?.vehicle.vehicleType ?? "Sedan"}
            vehicleColor={summary?.vehicle.color ?? trajectory?.vehicle.color ?? "Silver"}
            selectedIndex={selectedIndex}
            totalPoints={points.length}
            onNextCheckpoint={() => {
              if (selectedIndex !== null && selectedIndex < points.length - 1) {
                setSelectedIndex(selectedIndex + 1);
              }
            }}
            onPrevCheckpoint={() => {
              if (selectedIndex !== null && selectedIndex > 0) {
                setSelectedIndex(selectedIndex - 1);
              }
            }}
          />
        </div>
      </div>

      {/* 12-Camera Multi-Screen Modal */}
      <LiveCameraGridModal
        isOpen={isCameraGridOpen}
        onClose={() => setIsCameraGridOpen(false)}
        cameras={cameras}
        targetVehicleType={summary?.vehicle.vehicleType ?? trajectory?.vehicle.vehicleType ?? "Sedan"}
      />

      {/* CCTV Video Feed Ingestion Modal */}
      <VideoIngestionModal
        isOpen={isVideoIngestOpen}
        onClose={() => setIsVideoIngestOpen(false)}
        onTargetDetected={(plate, vType, vColor) => handleSearch(plate, "historical", vType, vColor)}
      />

      {/* Indian Vehicle Registry VAHAN Modal */}
      <VehicleRegistryModal
        isOpen={isRegistryModalOpen}
        onClose={() => setIsRegistryModalOpen(false)}
        initialPlate={summary?.vehicle.plate ?? "MH12AB1234"}
      />
    </div>
  );
}
