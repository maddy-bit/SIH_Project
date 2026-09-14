"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TrajectoryPointDto } from "@/lib/api";
import { evidenceImageUrl } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatTimestamp } from "@/lib/format";
import { TiltCard3D } from "./TiltCard3D";

interface EvidenceViewerProps {
  point: TrajectoryPointDto | null;
}



export function EvidenceViewer({ point }: EvidenceViewerProps) {
  const imageUrl = evidenceImageUrl(point?.imagePath);

  return (
    <TiltCard3D>
      <div className="neo-box overflow-hidden">
        {/* Dedicated Box Header Strip */}
        <div className="neo-header">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 whitespace-nowrap">
            Evidence Frame
          </h2>
          {point ? (
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold bg-slate-100 text-slate-950 border border-slate-300 px-2 py-0.5 rounded-xs whitespace-nowrap shrink-0">
              CAM {point.cameraId}
            </span>
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
                {/* Viewfinder Frame */}
                <div className="relative overflow-hidden rounded-md border-2 border-slate-700 bg-slate-950">
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-xs bg-black/80 px-2.5 py-1 text-[11px] font-mono text-amber-300 font-bold border border-white/20">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span>REC • {point.cameraId}</span>
                  </div>

                  <div className="absolute top-2 right-2 z-20 rounded-xs bg-black/80 px-2.5 py-1 text-[11px] font-mono text-slate-200 font-bold border border-white/20">
                    4K OPTICAL
                  </div>

                  {/* CCTV Snapshot Image */}
                  <div className="relative flex min-h-[195px] w-full items-center justify-center bg-slate-950 overflow-hidden">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={`Evidence frame from ${point.cameraId}`}
                        className="w-full object-contain max-h-[260px]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-slate-300 font-mono font-bold">
                        <span className="text-3xl mb-2">📹</span>
                        <span>No snapshot frame available for this checkpoint</span>
                      </div>
                    )}

                    {/* Scanline overlay */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-15"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 1px, transparent 1px, transparent 3px)",
                      }}
                    />

                    {/* Laser Scanner Line */}
                    <motion.div
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                      className="pointer-events-none absolute inset-x-0 h-0.5 bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                    />

                    {/* Corner Reticles */}
                    <div className="pointer-events-none absolute top-2.5 left-2.5 h-3 w-3 border-t-2 border-l-2 border-white/70" />
                    <div className="pointer-events-none absolute top-2.5 right-2.5 h-3 w-3 border-t-2 border-r-2 border-white/70" />
                    <div className="pointer-events-none absolute bottom-2.5 left-2.5 h-3 w-3 border-b-2 border-l-2 border-white/70" />
                    <div className="pointer-events-none absolute bottom-2.5 right-2.5 h-3 w-3 border-b-2 border-r-2 border-white/70" />
                  </div>
                </div>

                {/* Detailed Forensic Metrics Readout */}
                <div className="mt-3 rounded-md border border-slate-300 bg-white p-3">
                  <dl className="grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                      Camera Node
                    </dt>
                    <dd className="text-right font-mono font-bold text-slate-950 truncate" title={`${point.cameraId} (${point.cameraName})`}>
                      {point.cameraId} <span className="font-sans font-medium text-slate-600">({point.cameraName})</span>
                    </dd>

                    <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                      Timestamp
                    </dt>
                    <dd className="text-right font-mono font-bold text-slate-950">
                      {formatTimestamp(point.timestamp)}
                    </dd>

                    <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                      OCR Confidence
                    </dt>
                    <dd className="text-right">
                      <ConfidenceBadge value={point.plateConfidence} label="Plate" />
                    </dd>

                    <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                      Vehicle Match
                    </dt>
                    <dd className="text-right">
                      <ConfidenceBadge value={point.detectionConfidence} label="Detection" />
                    </dd>

                    {point.incomingTransitionConfidence != null && (
                      <>
                        <dt className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
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
