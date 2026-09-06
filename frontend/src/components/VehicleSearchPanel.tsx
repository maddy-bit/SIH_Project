"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TiltCard3D } from "./TiltCard3D";

export type SearchMode = "historical" | "live" | "combined";

interface VehicleSearchPanelProps {
  onSearch: (plate: string, mode: SearchMode) => void;
  isSearching: boolean;
}

const MODES: { value: SearchMode; label: string; desc: string }[] = [
  { value: "historical", label: "Historical", desc: "Stored Trajectory" },
  { value: "live", label: "Live 3D Sim", desc: "Real-time Stream" },
  { value: "combined", label: "Hybrid", desc: "Route + Live Play" },
];

const PRESETS = [
  { plate: "MH12AB1234", desc: "Target: White SUV (4 Cams)", tag: "DEMO TARGET" },
  { plate: "DL04CA2020", desc: "Decoy: Black Sedan (CAM-02)", tag: "DECOY" },
  { plate: "KA05MH8899", desc: "Decoy: Silver Hatch (CAM-05)", tag: "DECOY" },
];

export function VehicleSearchPanel({ onSearch, isSearching }: VehicleSearchPanelProps) {
  const [plate, setPlate] = useState("MH12AB1234");
  const [mode, setMode] = useState<SearchMode>("historical");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim()) return;
    onSearch(plate.trim(), mode);
  }

  function handlePresetClick(presetPlate: string) {
    setPlate(presetPlate);
    onSearch(presetPlate, mode);
  }

  return (
    <TiltCard3D maxTilt={5} scale={1.01}>
      <form
        onSubmit={handleSubmit}
        className="card-3d-light relative rounded-2xl p-5 text-slate-900 overflow-hidden"
      >
        {/* Tactical HUD Corner Reticles */}
        <div className="pointer-events-none absolute top-2 left-2 h-2.5 w-2.5 border-t-2 border-l-2 border-sky-400" />
        <div className="pointer-events-none absolute top-2 right-2 h-2.5 w-2.5 border-t-2 border-r-2 border-sky-400" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 border-b-2 border-l-2 border-sky-400" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 border-b-2 border-r-2 border-sky-400" />

        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500 shadow-xs animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-800">
              Target Search & ANPR
            </h2>
          </div>
          <span className="text-[10px] font-mono text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md font-bold shadow-xs">
            YOLOv8 + EasyOCR
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700">
            <span>Vehicle Registration Plate</span>
            <span className="text-[10px] text-sky-700 font-mono font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              3D ANPR Active
            </span>
          </div>

          {/* 3D Realistic Indian HSRP Plate with Hologram Foil & Bevel */}
          <div className="plate-3d-light relative mt-2 flex items-center overflow-hidden rounded-xl border-2 border-slate-400/80 bg-gradient-to-r from-slate-100 via-white to-slate-100 shadow-md transition-all duration-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-200/60">
            {/* IND Blue Badge with Ashoka Chakra & Hologram Laser Stripe */}
            <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 px-3 py-2.5 text-white select-none border-r border-slate-300 shadow-xs">
              <span className="text-[9px] font-black tracking-tighter leading-none text-sky-100">IND</span>
              {/* Chakra Emblem */}
              <div className="my-0.5 h-3.5 w-3.5 rounded-full border border-sky-300 flex items-center justify-center bg-blue-950/40 shadow-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              </div>
              <span className="text-[7px] font-mono text-sky-200/90 leading-none">HSRP</span>
            </div>

            {/* Input with 3D Embossed Font styling */}
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="MH12AB1234"
              spellCheck={false}
              className="w-full bg-transparent px-3.5 py-2.5 font-mono text-xl font-black tracking-widest text-slate-900 placeholder-slate-400 outline-none uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
            />

            {/* Security Hologram Chip & Clear Button */}
            <div className="flex items-center gap-2 pr-3">
              <div
                title="HSRP Security Hologram"
                className="hidden sm:flex h-5 w-5 rounded items-center justify-center bg-gradient-to-tr from-amber-300 via-teal-200 to-sky-300 text-[8px] font-mono font-bold text-slate-800 border border-slate-300 shadow-xs select-none"
              >
                🇮🇳
              </div>
              {plate && (
                <button
                  type="button"
                  onClick={() => setPlate("")}
                  className="rounded-full p-1 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Subtle Metallic Specular Shimmer */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/5" />
          </div>
        </div>

        {/* Preset Target Pills */}
        <div className="mt-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
            Target Scenarios:
          </div>
          <div className="flex flex-col gap-2">
            {PRESETS.map((preset) => (
              <motion.button
                key={preset.plate}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePresetClick(preset.plate)}
                className={`group flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-all cursor-pointer ${
                  plate === preset.plate
                    ? "border-sky-400 bg-sky-50 text-sky-900 shadow-xs font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                    {preset.plate}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">{preset.desc}</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                    preset.tag === "DEMO TARGET"
                      ? "bg-sky-100 text-sky-800 border border-sky-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {preset.tag}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="mt-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
            Tracking Mode:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer ${
                  mode === m.value
                    ? "border-sky-400 bg-sky-50 text-sky-800 shadow-xs font-bold ring-1 ring-sky-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-xs">{m.label}</span>
                <span className="text-[9px] opacity-75 font-mono">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3D Tactile Push Action Button */}
        <motion.button
          type="submit"
          disabled={isSearching || !plate.trim()}
          whileTap={{ scale: 0.98 }}
          className="btn-3d-light mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wider text-white shadow-md uppercase cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none"
        >
          {isSearching ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Scanning Camera Mesh…</span>
            </>
          ) : (
            <>
              <span>⚡ Reconstruct 3D Trajectory</span>
            </>
          )}
        </motion.button>
      </form>
    </TiltCard3D>
  );
}
