"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TrajectoryPointDto } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatTimestamp } from "@/lib/format";
import { TiltCard3D } from "./TiltCard3D";

interface EvidenceViewerProps {
  point: TrajectoryPointDto | null;
  targetPlate?: string;
  selectedIndex?: number | null;
  totalPoints?: number;
  vehicleType?: string | null;
  vehicleColor?: string | null;
  customVideoUrls?: Record<string, string>;
  onNextCheckpoint?: () => void;
  onPrevCheckpoint?: () => void;
}

export function EvidenceViewer({
  point,
  targetPlate = "ET3633P",
  vehicleType = "Sedan",
  vehicleColor = "Silver",
  customVideoUrls = {},
  selectedIndex = null,
  totalPoints = 0,
  onNextCheckpoint,
  onPrevCheckpoint,
}: EvidenceViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [failedVideos, setFailedVideos] = useState<Record<string, boolean>>({});

  // Active point fallback: if no checkpoint selected, show CAM-01 corridor node
  const activePoint: TrajectoryPointDto = point ?? {
    cameraId: "CAM-01",
    cameraName: "Shivajinagar Chowk",
    latitude: 18.5308,
    longitude: 73.8474,
    direction: "SE",
    timestamp: "2026-08-30T18:14:23Z",
    plateConfidence: 0.968,
    detectionConfidence: 0.942,
    imagePath: "CAM-01/frame_001.jpg",
    detectionCount: 3,
    incomingTransitionConfidence: null,
    transitionNote: null,
  };

  const currentCam = activePoint.cameraId;

  // Check if a video was ingested for this camera (e.g. from 4-camera video ingestion)
  const videoUrl = customVideoUrls[currentCam] || null;
  const hasIngestedVideo = Boolean(videoUrl) && !failedVideos[currentCam];

  // =========================================================================
  // REAL-TIME ML YOLOv8 PLATE DETECTION & TRACKING STATE
  // =========================================================================
  const [isPlateDetected, setIsPlateDetected] = useState<boolean>(false);
  const [plateBox, setPlateBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>({ left: 38.0, top: 53.0, width: 14.5, height: 6.8 });

  const [vehBox, setVehBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const [trackingConfidence, setTrackingConfidence] = useState<number>(0.968);
  const [modelTag, setModelTag] = useState<string>("YOLOv8");

  // Real-time inference loop: sends current video frame to backend ML model
  useEffect(() => {
    if (!hasIngestedVideo) {
      setIsPlateDetected(false);
      setVehBox(null);
      return;
    }

    let isSubscribed = true;
    let isRequestPending = false;
    let consecutiveMisses = 0;

    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext("2d");

    const runMLInference = async () => {
      if (!isSubscribed || isRequestPending) return;
      const video = videoRef.current;
      if (!video || video.paused || video.ended || video.readyState < 2) return;

      isRequestPending = true;
      try {
        if (ctx) {
          ctx.drawImage(video, 0, 0, 480, 270);
          const imageBase64 = canvas.toDataURL("image/jpeg", 0.72);

          const res = await fetch("/api/yolo/detect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: imageBase64,
              targetPlate,
              cameraId: currentCam,
            }),
          });

          if (res.ok && isSubscribed) {
            const data = await res.json();
            if (data.detected && data.box) {
              consecutiveMisses = 0;
              setIsPlateDetected(true);
              setPlateBox((prev) => ({
                left: +(prev.left * 0.35 + data.box.left * 0.65).toFixed(2),
                top: +(prev.top * 0.35 + data.box.top * 0.65).toFixed(2),
                width: +(prev.width * 0.35 + data.box.width * 0.65).toFixed(2),
                height: +(prev.height * 0.35 + data.box.height * 0.65).toFixed(2),
              }));
              if (data.confidence) {
                setTrackingConfidence(data.confidence);
              }
              if (data.model) {
                setModelTag(data.model);
              }
              if (data.veh_box) {
                setVehBox(data.veh_box);
              }
            } else {
              consecutiveMisses++;
              if (consecutiveMisses > 4) {
                setIsPlateDetected(false);
                setVehBox(null);
              }
            }
          }
        }
      } catch {
        // Handled silently
      } finally {
        isRequestPending = false;
      }
    };

    const intervalId = setInterval(runMLInference, 260);
    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [hasIngestedVideo, currentCam, targetPlate, videoUrl]);

  // Replay video cleanly when checkpoint or video changes
  useEffect(() => {
    if (videoRef.current && hasIngestedVideo) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [activePoint.cameraId, activePoint.timestamp, videoUrl, hasIngestedVideo]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <TiltCard3D>
      <div className="neo-box overflow-hidden">
        {/* Box Header Strip */}
        <div className="neo-header">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-2 w-2 rounded-full ${
                hasIngestedVideo && isPlateDetected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 whitespace-nowrap">
              CCTV Evidence Frame
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-xs whitespace-nowrap shrink-0">
              {activePoint.cameraId}
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs border ${
                hasIngestedVideo && isPlateDetected
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : hasIngestedVideo
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
            >
              {hasIngestedVideo && isPlateDetected
                ? "TARGET TRACKED"
                : hasIngestedVideo
                ? "SCANNING FEED"
                : "STANDBY"}
            </span>
          </div>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activePoint.cameraId}-${activePoint.timestamp}-${videoUrl}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Optical Viewfinder Frame */}
              <div className="relative overflow-hidden rounded-md border-2 border-slate-700 bg-black select-none shadow-md">
                {/* VIEWPORT AREA */}
                {!hasIngestedVideo ? (
                  /* Clean, simple black screen when no video is ingested (no text and no hardcoded green box) */
                  <div className="relative flex min-h-[220px] sm:min-h-[260px] w-full items-center justify-center bg-black overflow-hidden select-none">
                    {/* Checkpoint navigation controls available on bottom bar even in standby */}
                    {totalPoints > 1 && (
                      <div className="absolute bottom-2 right-2 z-30 flex items-center gap-1.5 rounded-xs bg-black/80 px-2 py-1 border border-white/20">
                        {onPrevCheckpoint && (
                          <button
                            type="button"
                            disabled={selectedIndex === 0 || selectedIndex === null}
                            onClick={onPrevCheckpoint}
                            className="px-2 py-0.5 rounded-xs bg-slate-800 text-white text-[10px] font-mono font-bold hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            ◀ Prev
                          </button>
                        )}
                        {selectedIndex !== null && totalPoints > 0 && (
                          <span className="text-[10px] font-mono text-slate-300 font-bold px-1">
                            {selectedIndex + 1}/{totalPoints}
                          </span>
                        )}
                        {onNextCheckpoint && (
                          <button
                            type="button"
                            disabled={selectedIndex === null || selectedIndex >= totalPoints - 1}
                            onClick={onNextCheckpoint}
                            className="px-2 py-0.5 rounded-xs bg-slate-800 text-white text-[10px] font-mono font-bold hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            Next ▶
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Active Ingested Video Feed */
                  <div className="relative flex min-h-[220px] sm:min-h-[260px] w-full items-center justify-center bg-black overflow-hidden">
                    {/* Top-Left Minimal Recording Status */}
                    <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 rounded-xs bg-black/85 px-2.5 py-1 text-[11px] font-mono text-emerald-400 font-bold border border-emerald-500/40 backdrop-blur-xs">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span>REC • {activePoint.cameraId}</span>
                    </div>

                    {/* Primary HTML5 CCTV Video Stream */}
                    <video
                      ref={videoRef}
                      key={videoUrl}
                      src={videoUrl || undefined}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={() => setFailedVideos((prev) => ({ ...prev, [currentCam]: true }))}
                      className="w-full h-auto max-h-[280px] object-cover"
                    />

                    {/* ========================================================================= */}
                    {/* REAL-TIME ML DYNAMIC YOLO GREEN BOUNDING BOX                             */}
                    {/* Strictly rendered only when ML model in backend detects number plate      */}
                    {/* ========================================================================= */}
                    {isPlateDetected && (
                      <>
                        {/* Green Rectangular Bounding Box for License Plate */}
                        <div
                          className="absolute pointer-events-none z-20 transition-all duration-150 ease-out"
                          style={{
                            left: `${plateBox.left}%`,
                            top: `${plateBox.top}%`,
                            width: `${plateBox.width}%`,
                            height: `${plateBox.height}%`,
                          }}
                        >
                          <div className="relative w-full h-full border-2 border-emerald-400 bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.7)]">
                            {/* 4 Neon Green Corner Reticles */}
                            <div className="absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-emerald-300" />
                            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-emerald-300" />
                            <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-emerald-300" />
                            <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-emerald-300" />

                            {/* Centered Optical Crosshair */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] text-emerald-300/80 font-mono font-bold leading-none select-none">
                                +
                              </span>
                            </div>

                            {/* Floating Plate Detection Label Tag */}
                            <div className="absolute -top-6 left-0 flex items-center gap-1.5 rounded-xs bg-emerald-500 px-2 py-0.5 text-[10px] font-mono font-black text-slate-950 shadow-md whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-ping" />
                              <span className="tracking-widest">{targetPlate}</span>
                              <span className="bg-slate-950 text-emerald-300 px-1 rounded-xs text-[9px]">
                                {Math.round(trackingConfidence * 100)}% {modelTag}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Bounding Box (when localized by ML model) */}
                        {vehBox && (
                          <div
                            className="absolute pointer-events-none z-10 border border-dashed border-emerald-400/50 bg-emerald-400/5 transition-all duration-150 ease-out"
                            style={{
                              left: `${vehBox.left}%`,
                              top: `${vehBox.top}%`,
                              width: `${vehBox.width}%`,
                              height: `${vehBox.height}%`,
                            }}
                          >
                            <div className="absolute -top-4 left-0 rounded-xs bg-black/80 px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/30 uppercase">
                              VEHICLE: {(vehicleColor ? `${vehicleColor} ` : "").toUpperCase()}
                              {(vehicleType || "Sedan").toUpperCase()}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Scanline overlay */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-15"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 3px)",
                      }}
                    />

                    {/* Laser Scanner Line */}
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 3.2, ease: "linear" }}
                      className="pointer-events-none absolute inset-x-0 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_#10b981]"
                    />

                    {/* Bottom CCTV Controls Bar */}
                    <div className="absolute bottom-2 inset-x-2 z-30 flex items-center justify-between rounded-xs bg-black/80 px-3 py-1.5 backdrop-blur-xs border border-white/20">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="flex h-6 w-6 items-center justify-center rounded-xs bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                          title={isPlaying ? "Pause Feed" : "Play Feed"}
                        >
                          {isPlaying ? "❚❚" : "▶"}
                        </button>
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="flex h-6 w-6 items-center justify-center rounded-xs bg-slate-800 text-white hover:bg-slate-700 text-xs transition-all cursor-pointer"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? "🔇" : "🔊"}
                        </button>
                      </div>

                      {/* Step through Checkpoints */}
                      <div className="flex items-center gap-1.5">
                        {onPrevCheckpoint && (
                          <button
                            type="button"
                            disabled={selectedIndex === 0 || selectedIndex === null}
                            onClick={onPrevCheckpoint}
                            className="px-2 py-0.5 rounded-xs bg-slate-800 text-white text-[10px] font-mono font-bold hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            ◀ Prev
                          </button>
                        )}
                        {selectedIndex !== null && totalPoints > 0 && (
                          <span className="text-[10px] font-mono text-slate-300 font-bold px-1">
                            {selectedIndex + 1}/{totalPoints}
                          </span>
                        )}
                        {onNextCheckpoint && (
                          <button
                            type="button"
                            disabled={selectedIndex === null || selectedIndex >= totalPoints - 1}
                            onClick={onNextCheckpoint}
                            className="px-2 py-0.5 rounded-xs bg-slate-800 text-white text-[10px] font-mono font-bold hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            Next ▶
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Forensic Metrics Readout */}
              <div className="mt-3 rounded-md border border-slate-300 bg-white p-3">
                <dl className="grid grid-cols-2 gap-y-2 text-xs">
                  <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                    Camera Node
                  </dt>
                  <dd
                    className="text-right font-mono font-bold text-slate-950 truncate"
                    title={`${activePoint.cameraId} (${activePoint.cameraName})`}
                  >
                    {activePoint.cameraId}{" "}
                    <span className="font-sans font-medium text-slate-600">
                      ({activePoint.cameraName})
                    </span>
                  </dd>

                  <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                    Timestamp
                  </dt>
                  <dd className="text-right font-mono font-bold text-slate-950">
                    {formatTimestamp(activePoint.timestamp)}
                  </dd>

                  <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                    ANPR Plate Match
                  </dt>
                  <dd className="text-right">
                    <ConfidenceBadge value={trackingConfidence} label="Plate" />
                  </dd>

                  <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                    Vehicle Match
                  </dt>
                  <dd className="text-right">
                    <ConfidenceBadge
                      value={
                        (activePoint.detectionConfidence ?? 0.942) > 1
                          ? (activePoint.detectionConfidence ?? 94.2) / 100
                          : activePoint.detectionConfidence ?? 0.942
                      }
                      label="Detection"
                    />
                  </dd>

                  {activePoint.incomingTransitionConfidence != null && (
                    <>
                      <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                        Transition Score
                      </dt>
                      <dd className="text-right">
                        <ConfidenceBadge
                          value={activePoint.incomingTransitionConfidence}
                          label="Score"
                        />
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </TiltCard3D>
  );
}
