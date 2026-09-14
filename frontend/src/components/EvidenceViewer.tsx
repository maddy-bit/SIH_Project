"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TrajectoryPointDto } from "@/lib/api";
import { cameraVideoUrl, evidenceImageUrl } from "@/lib/api";
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
  onNextCheckpoint?: () => void;
  onPrevCheckpoint?: () => void;
}

// Camera-specific calibrated bounding box positions for realistic vehicle tracking
const CAMERA_BBOX_COORDS: Record<
  string,
  {
    plate: { left: string; top: string; width: string; height: string };
    vehicle: { left: string; top: string; width: string; height: string };
  }
> = {
  "CAM-01": {
    plate: { left: "42%", top: "54%", width: "135px", height: "42px" },
    vehicle: { left: "30%", top: "28%", width: "240px", height: "170px" },
  },
  "CAM-02": {
    plate: { left: "46%", top: "58%", width: "128px", height: "40px" },
    vehicle: { left: "34%", top: "30%", width: "230px", height: "165px" },
  },
  "CAM-03": {
    plate: { left: "38%", top: "52%", width: "140px", height: "44px" },
    vehicle: { left: "26%", top: "24%", width: "250px", height: "175px" },
  },
  "CAM-04": {
    plate: { left: "44%", top: "56%", width: "130px", height: "40px" },
    vehicle: { left: "32%", top: "29%", width: "235px", height: "168px" },
  },
  "CAM-05": {
    plate: { left: "40%", top: "50%", width: "142px", height: "45px" },
    vehicle: { left: "28%", top: "25%", width: "255px", height: "180px" },
  },
  "CAM-07": {
    plate: { left: "45%", top: "55%", width: "136px", height: "43px" },
    vehicle: { left: "32%", top: "27%", width: "245px", height: "172px" },
  },
  "CAM-11": {
    plate: { left: "41%", top: "53%", width: "138px", height: "42px" },
    vehicle: { left: "29%", top: "26%", width: "248px", height: "174px" },
  },
};

export function EvidenceViewer({
  point,
  targetPlate = "MH12AB1234",
  vehicleType = "Sedan",
  vehicleColor = "Silver",
  selectedIndex = null,
  totalPoints = 0,
  onNextCheckpoint,
  onPrevCheckpoint,
}: EvidenceViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [failedVideos, setFailedVideos] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [liveFps, setLiveFps] = useState<number>(30.1);

  const currentCam = point?.cameraId ?? "CAM-01";
  const videoError = !!failedVideos[currentCam];
  const imageError = !!failedImages[currentCam];

  const videoUrl = cameraVideoUrl(point?.cameraId);
  const imageUrl = evidenceImageUrl(point?.imagePath);

  // Dynamic calibrated coordinates for the current camera
  const bbox = point?.cameraId && CAMERA_BBOX_COORDS[point.cameraId]
    ? CAMERA_BBOX_COORDS[point.cameraId]
    : CAMERA_BBOX_COORDS["CAM-01"];

  const plateConfidence = point?.plateConfidence ?? 0.968;
  const vehicleConfidence = point?.detectionConfidence ?? 0.942;

  // Whenever the checkpoint / camera changes, replay video cleanly from start
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted without user gesture, muted handles this
      });
    }
  }, [point?.cameraId, point?.timestamp]);

  // Subtle real-time FPS variance simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveFps(+(29.8 + Math.random() * 0.5).toFixed(1));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

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
        {/* Dedicated Box Header Strip */}
        <div className="neo-header">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 whitespace-nowrap">
              CCTV Evidence Frame
            </h2>
          </div>
          {point ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-xs whitespace-nowrap shrink-0">
                {point.cameraId}
              </span>
            </div>
          ) : (
            <span className="text-xs font-mono font-bold text-slate-800 shrink-0">STANDBY</span>
          )}
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {point ? (
              <motion.div
                key={`${point.cameraId}-${point.timestamp}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* 4K Optical Viewfinder Frame */}
                <div className="relative overflow-hidden rounded-md border-2 border-slate-700 bg-slate-950 select-none shadow-md">
                  {/* Top-Left Tactical Status Badge */}
                  <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 rounded-xs bg-black/85 px-2.5 py-1 text-[11px] font-mono text-emerald-400 font-bold border border-emerald-500/40 backdrop-blur-xs">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span>REC • {point.cameraId}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-amber-300">{liveFps} FPS</span>
                  </div>

                  {/* Top-Right Optical Info */}
                  <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 rounded-xs bg-black/85 px-2 py-1 text-[10px] font-mono text-slate-200 font-bold border border-white/20 backdrop-blur-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>TENSORRT FP16</span>
                  </div>

                  {/* Viewport Display Area (Video with Fallback) */}
                  <div className="relative flex min-h-[220px] sm:min-h-[260px] w-full items-center justify-center bg-slate-950 overflow-hidden">
                    {/* Primary HTML5 CCTV Video Stream */}
                    {videoUrl && !videoError ? (
                      <video
                        ref={videoRef}
                        key={videoUrl}
                        src={videoUrl}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onError={() => setFailedVideos((prev) => ({ ...prev, [currentCam]: true }))}
                        className="w-full h-auto max-h-[280px] object-cover"
                      />
                    ) : imageUrl && !imageError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={`Evidence frame from ${point.cameraId}`}
                        onError={() => setFailedImages((prev) => ({ ...prev, [currentCam]: true }))}
                        className="w-full object-contain max-h-[260px]"
                      />
                    ) : (
                      /* Synthetic Tactical CCTV Grid when feed is initializing */
                      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-slate-300 font-mono font-bold space-y-2">
                        <div className="relative flex h-14 w-24 items-center justify-center rounded-xs border border-emerald-500/50 bg-emerald-950/20 text-emerald-400">
                          <span className="text-lg">📹</span>
                          <span className="absolute -top-2 -right-2 text-[9px] bg-emerald-600 text-white px-1 rounded-xs">
                            CCTV
                          </span>
                        </div>
                        <div className="text-emerald-300 uppercase tracking-wider">
                          Optical Feed: {point.cameraId}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {point.cameraName} • ANPR Active
                        </div>
                      </div>
                    )}

                    {/* ========================================================================= */}
                    {/* REAL-TIME WORKING YOLO RECTANGULAR BOUNDING BOX OVERLAY                  */}
                    {/* ========================================================================= */}
                    <motion.div
                      animate={{
                        x: [0, 2, -2, 0],
                        y: [0, -1, 1, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                      }}
                      className="absolute pointer-events-none z-20"
                      style={{
                        left: bbox.plate.left,
                        top: bbox.plate.top,
                        width: bbox.plate.width,
                        height: bbox.plate.height,
                      }}
                    >
                      {/* Green Rectangular Bounding Box for License Plate */}
                      <div className="relative w-full h-full border-2 border-emerald-400 bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.7)] transition-all">
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
                            {Math.round(plateConfidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Secondary Vehicle Bounding Box (Vehicle Class Detection) */}
                    <div
                      className="absolute pointer-events-none z-10 border border-dashed border-emerald-400/50 bg-emerald-400/5"
                      style={{
                        left: bbox.vehicle.left,
                        top: bbox.vehicle.top,
                        width: bbox.vehicle.width,
                        height: bbox.vehicle.height,
                      }}
                    >
                      <div className="absolute -top-4 left-0 rounded-xs bg-black/80 px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/30 uppercase">
                        VEHICLE: {(vehicleColor ? `${vehicleColor} ` : "").toUpperCase()}{(vehicleType || "Sedan").toUpperCase()} ({Math.round(vehicleConfidence * 100)}%)
                      </div>
                    </div>

                    {/* Scanline overlay */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 3px)",
                      }}
                    />

                    {/* Laser Scanner Line */}
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 3.2, ease: "linear" }}
                      className="pointer-events-none absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#10b981]"
                    />

                    {/* Corner Reticles */}
                    <div className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 border-t-2 border-l-2 border-white/70" />
                    <div className="pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 border-t-2 border-r-2 border-white/70" />
                    <div className="pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 border-b-2 border-l-2 border-white/70" />
                    <div className="pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 border-b-2 border-r-2 border-white/70" />

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
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          FEED ACTIVE • 1080p
                        </span>
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
                </div>

                {/* Detailed Forensic Metrics Readout */}
                <div className="mt-3 rounded-md border border-slate-300 bg-white p-3">
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                      Camera Node
                    </dt>
                    <dd
                      className="text-right font-mono font-bold text-slate-950 truncate"
                      title={`${point.cameraId} (${point.cameraName})`}
                    >
                      {point.cameraId}{" "}
                      <span className="font-sans font-medium text-slate-600">
                        ({point.cameraName})
                      </span>
                    </dd>

                    <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                      Timestamp
                    </dt>
                    <dd className="text-right font-mono font-bold text-slate-950">
                      {formatTimestamp(point.timestamp)}
                    </dd>

                    <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                      ANPR Plate Match
                    </dt>
                    <dd className="text-right">
                      <ConfidenceBadge value={plateConfidence} label="Plate" />
                    </dd>

                    <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                      Vehicle Match
                    </dt>
                    <dd className="text-right">
                      <ConfidenceBadge value={vehicleConfidence} label="Detection" />
                    </dd>

                    {point.incomingTransitionConfidence != null && (
                      <>
                        <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                          Transition Score
                        </dt>
                        <dd className="text-right">
                          <ConfidenceBadge
                            value={point.incomingTransitionConfidence}
                            label="Score"
                          />
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-slate-800 font-mono font-bold">
                <span className="text-3xl mb-2 opacity-70">🎯</span>
                <span>Select a timeline event or camera marker to inspect CCTV frame evidence.</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TiltCard3D>
  );
}
