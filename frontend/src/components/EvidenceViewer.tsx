"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TrajectoryPointDto } from "@/lib/api";
import { evidenceImageUrl } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatTimestamp } from "@/lib/format";
import { TiltCard3D } from "./TiltCard3D";

interface EvidenceViewerProps {
  point: TrajectoryPointDto | null;
}

type VisionMode = "standard" | "thermal" | "edge";

export function EvidenceViewer({ point }: EvidenceViewerProps) {
  const imageUrl = evidenceImageUrl(point?.imagePath);
  const [visionMode, setVisionMode] = useState<VisionMode>("standard");

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
              CCTV Camera Evidence
            </h2>
          </div>
          {point && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              EVIDENCE FRAME
            </span>
          )}
        </div>

        {/* Vision Filter Switcher */}
        {point && (
          <div className="mt-3 flex items-center justify-between gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <span className="pl-2 text-[9px] font-mono font-bold text-slate-500 uppercase">
              Vision Mode:
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: "standard", label: "Standard" },
                  { id: "thermal", label: "Thermal IR" },
                  { id: "edge", label: "AI Edge" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setVisionMode(mode.id)}
                  className={`rounded-lg px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    visionMode === mode.id
                      ? "bg-white text-sky-800 shadow-xs border border-sky-300"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {point ? (
            <motion.div
              key={`${point.cameraId}-${point.timestamp}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              {/* Viewfinder Frame with Tactical Corner Brackets */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-lg">
                <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-lg bg-black/85 px-2.5 py-1 text-[10px] font-mono text-cyan-300 backdrop-blur-md border border-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>FEED // {point.cameraId}</span>
                </div>

                <div className="absolute top-2.5 right-2.5 z-20 rounded-lg bg-black/85 px-2.5 py-1 text-[10px] font-mono text-slate-300 backdrop-blur-md border border-slate-700">
                  {visionMode.toUpperCase()} FILTER
                </div>

                {/* CCTV Snapshot Image with 3D Depth Shaders */}
                <div className="relative flex min-h-[195px] w-full items-center justify-center bg-slate-950 overflow-hidden">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={`Evidence frame from ${point.cameraId}`}
                      className={`w-full object-contain max-h-[260px] transition-all duration-300 ${
                        visionMode === "thermal"
                          ? "invert hue-rotate-180 contrast-150 saturate-200"
                          : visionMode === "edge"
                          ? "contrast-200 brightness-110 grayscale"
                          : ""
                      }`}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 font-mono">
                      <span className="text-3xl mb-2">📹</span>
                      <span>No snapshot frame available for this checkpoint</span>
                    </div>
                  )}

                  {/* Holographic Scanline Overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
                    }}
                  />

                  {/* Animated Scanning Laser Line */}
                  <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                    className="pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shadow-[0_0_8px_#38bdf8]"
                  />

                  {/* Viewfinder Reticles */}
                  <div className="pointer-events-none absolute inset-0 border-2 border-cyan-500/20 m-2.5 rounded-xl" />
                  <div className="pointer-events-none absolute top-4 left-4 h-3.5 w-3.5 border-t-2 border-l-2 border-cyan-400" />
                  <div className="pointer-events-none absolute top-4 right-4 h-3.5 w-3.5 border-t-2 border-r-2 border-cyan-400" />
                  <div className="pointer-events-none absolute bottom-4 left-4 h-3.5 w-3.5 border-b-2 border-l-2 border-cyan-400" />
                  <div className="pointer-events-none absolute bottom-4 right-4 h-3.5 w-3.5 border-b-2 border-r-2 border-cyan-400" />
                </div>
              </div>

              {/* Detailed Forensic Metrics Readout */}
              <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-inner">
                <dl className="grid grid-cols-2 gap-y-2.5 text-xs">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Camera Node
                  </dt>
                  <dd className="text-right font-mono font-bold text-slate-900">
                    {point.cameraId} ({point.cameraName})
                  </dd>

                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Timestamp
                  </dt>
                  <dd className="text-right font-mono font-bold text-slate-900">
                    {formatTimestamp(point.timestamp)}
                  </dd>

                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    OCR Confidence
                  </dt>
                  <dd className="text-right">
                    <ConfidenceBadge value={point.plateConfidence} />
                  </dd>

                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Detection Confidence
                  </dt>
                  <dd className="text-right">
                    <ConfidenceBadge value={point.detectionConfidence} />
                  </dd>

                  {point.incomingTransitionConfidence != null && (
                    <>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Transition Score
                      </dt>
                      <dd className="text-right">
                        <ConfidenceBadge value={point.incomingTransitionConfidence} label="Score" />
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400 font-medium">
              <span className="text-3xl mb-2 opacity-60">🎯</span>
              <span>Select a timeline event or a camera marker on the map to inspect CCTV frame evidence.</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </TiltCard3D>
  );
}
