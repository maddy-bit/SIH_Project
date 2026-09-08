"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CameraDto } from "@/lib/api";

interface LiveCameraGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: CameraDto[];
}

export function LiveCameraGridModal({ isOpen, onClose, cameras }: LiveCameraGridModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "ONLINE" | "PROCESSING">("ALL");
  const [expandedCam, setExpandedCam] = useState<CameraDto | null>(null);

  if (!isOpen) return null;

  const filteredCameras = cameras.filter((c) => {
    if (selectedFilter === "ONLINE") return c.status === "ONLINE";
    if (selectedFilter === "PROCESSING") return c.status === "PROCESSING";
    return true;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-900/60">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative flex h-[90vh] w-full max-w-7xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        >
          {/* Top Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 font-bold border border-sky-200">
                    LIVE AI MATRIX
                  </span>
                  <span className="text-xs font-semibold text-slate-500">12 CAMERA CCTV SURVEILLANCE GRID</span>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <span>Smart City Video Analytics Wall</span>
                  <span className="text-xs font-mono text-emerald-600 font-semibold">● REC 60FPS</span>
                </h2>
              </div>
            </div>

            {/* Filter Tabs & Close Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                {(["ALL", "ONLINE", "PROCESSING"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-lg px-3 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedFilter === filter
                        ? "bg-sky-50 text-sky-700 border border-sky-300 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 12-Camera Grid Matrix */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCameras.map((cam, index) => {
                const isOnline = cam.status === "ONLINE" || cam.status === "PROCESSING";

                return (
                  <motion.div
                    key={cam.id}
                    whileHover={{ scale: 1.02 }}
                    className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md group hover:border-sky-400 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setExpandedCam(cam)}
                  >
                    {/* Camera Feed Viewport Header */}
                    <div className="flex items-center justify-between bg-white px-3 py-2 border-b border-slate-100 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
                        <span className="font-bold text-slate-900">{cam.id}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[130px]">{cam.name}</span>
                    </div>

                    {/* Simulated Tactical Video Feed */}
                    <div className="relative h-40 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                      {/* Viewfinder crosshairs */}
                      <div className="absolute top-2 left-2 h-2 w-2 border-t-2 border-l-2 border-cyan-400/80" />
                      <div className="absolute top-2 right-2 h-2 w-2 border-t-2 border-r-2 border-cyan-400/80" />
                      <div className="absolute bottom-2 left-2 h-2 w-2 border-b-2 border-l-2 border-cyan-400/80" />
                      <div className="absolute bottom-2 right-2 h-2 w-2 border-b-2 border-r-2 border-cyan-400/80" />

                      {/* Simulated Bounding Box Overlay */}
                      {isOnline && (
                        <div className="absolute top-8 left-12 h-20 w-28 rounded border-2 border-emerald-400 bg-emerald-500/10 flex flex-col justify-between p-1 text-[9px] font-mono font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                          <div className="flex items-center justify-between">
                            <span>SUV 96%</span>
                            <span className="bg-emerald-950/80 px-1 rounded">TRK-0{index + 1}</span>
                          </div>
                          <div className="bg-slate-950/90 px-1 py-0.5 rounded text-[8px] text-cyan-300 border border-emerald-500/40 self-start">
                            MH12AB1234
                          </div>
                        </div>
                      )}

                      {/* Feed Info Watermark */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[9px] font-mono text-zinc-300 bg-slate-950/80 px-1.5 py-0.5 rounded">
                        <span className="text-cyan-400 font-bold">{cam.direction}</span>
                        <span>• 4K@60fps</span>
                      </div>

                      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-emerald-400 font-bold bg-slate-950/80 px-1.5 py-0.5 rounded">
                        ANPR LIVE
                      </div>
                    </div>

                    {/* Camera Footer Telemetry */}
                    <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 text-[10px] font-mono text-slate-500 border-t border-slate-100">
                      <span>Lat: {cam.latitude.toFixed(4)}</span>
                      <span>Lng: {cam.longitude.toFixed(4)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Expanded Camera Modal View */}
          {expandedCam && (
            <div className="absolute inset-0 z-30 flex flex-col bg-white/95 p-6 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      {expandedCam.id} {"//"} {expandedCam.name}
                    </h3>
                    <div className="text-xs font-mono font-semibold text-sky-700">HIGH-PRECISION ANPR OPTICAL FEED</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedCam(null)}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Back to Grid
                </button>
              </div>

              <div className="mt-4 flex-1 relative flex items-center justify-center rounded-2xl border border-slate-300 bg-slate-950 overflow-hidden shadow-2xl">
                <div className="text-center font-mono text-sm text-zinc-300">
                  <div className="text-4xl mb-2">📹</div>
                  <div className="text-white font-bold">LIVE 4K CAMERA STREAM — {expandedCam.id}</div>
                  <div className="text-xs text-cyan-400 mt-1">Vehicle Detection + Tracking Active (0.012s Latency)</div>
                </div>
                <div className="absolute top-4 left-4 border border-slate-700 bg-slate-900/90 p-3 rounded-xl text-xs font-mono text-zinc-200">
                  <div>FPS: <span className="text-emerald-400 font-bold">59.8</span></div>
                  <div>Bitrate: <span className="text-cyan-400 font-bold">14.2 Mbps</span></div>
                  <div>Resolution: <span className="text-white font-bold">3840 x 2160 UHD</span></div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
