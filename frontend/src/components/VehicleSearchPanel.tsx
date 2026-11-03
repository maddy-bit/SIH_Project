"use client";

import { useState } from "react";
import { TiltCard3D } from "./TiltCard3D";
import { resolveRtoArea } from "@/lib/rtoDirectory";

export type SearchMode = "historical" | "live" | "combined";

interface VehicleSearchPanelProps {
  onSearch: (plate: string, mode: SearchMode) => void;
  isSearching: boolean;
  currentPlate?: string;
  onPlateChange?: (plate: string) => void;
}

const MODES: { value: SearchMode; label: string; desc: string }[] = [
  { value: "historical", label: "Historical", desc: "Stored Trajectory" },
  { value: "live", label: "Live 3D Sim", desc: "Real-time Stream" },
  { value: "combined", label: "Hybrid", desc: "Route + Live Play" },
];

const PRESETS = [
  { plate: "UP14 AN 7225", desc: "Silver Sedan (Dasna Corridor - UP-14)", tag: "DEMO TARGET" },
  { plate: "DL04 CA 2020", desc: "Black Sedan (Connaught Place - DL)", tag: "DELHI" },
  { plate: "MH12 AB 1234", desc: "Silver Sedan (Pune Expressway - MH-12)", tag: "PUNE" },
  { plate: "KA05 MH 8899", desc: "Silver Hatch (Electronic City - KA-05)", tag: "BENGALURU" },
];

export function VehicleSearchPanel({ onSearch, isSearching, currentPlate, onPlateChange }: VehicleSearchPanelProps) {
  const [plate, setPlate] = useState(currentPlate ?? "");
  const [prevCurrentPlate, setPrevCurrentPlate] = useState(currentPlate);
  const [mode, setMode] = useState<SearchMode>("historical");

  // Keep internal plate in sync if parent updates it (e.g. after video ingestion)
  if (currentPlate !== undefined && currentPlate !== prevCurrentPlate) {
    setPrevCurrentPlate(currentPlate);
    setPlate(currentPlate);
  }

  const activeRto = resolveRtoArea(plate);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = plate.trim() || "UP14 AN 7225";
    if (!plate.trim()) {
      setPlate(target);
      onPlateChange?.(target);
    }
    onSearch(target, mode);
  }

  function handlePresetClick(presetPlate: string) {
    setPlate(presetPlate);
    onPlateChange?.(presetPlate);
  }

  function handleInputChange(val: string) {
    const formatted = val.toUpperCase();
    setPlate(formatted);
    onPlateChange?.(formatted);
  }

  function handleClear() {
    setPlate("");
    onPlateChange?.("");
  }

  return (
    <TiltCard3D>
      <form
        onSubmit={handleSubmit}
        className="neo-box overflow-hidden"
      >
        {/* Dedicated Box Header Strip */}
        <div className="neo-header">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 whitespace-nowrap">
            Target Search
          </h2>
          <span className="text-xs font-mono font-bold text-slate-800 shrink-0">ANPR</span>
        </div>

        <div className="p-4 space-y-3.5">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Registration Plate Number
            </label>

            {/* High-Contrast Indian HSRP Plate Frame */}
            <div className="plate-box relative flex items-center overflow-hidden rounded-md border-2 border-slate-500 bg-white focus-within:border-slate-900 transition-all">
              {/* IND Blue Badge */}
              <div className="relative flex flex-col items-center justify-center bg-[#1e3a8a] px-3 py-2 text-white select-none border-r-2 border-slate-500 shrink-0">
                <span className="text-[10px] font-black tracking-tighter leading-none text-white">IND</span>
                <div className="my-0.5 h-2.5 w-2.5 rounded-full border border-white flex items-center justify-center bg-blue-950">
                  <div className="h-1 w-1 rounded-full bg-white" />
                </div>
                <span className="text-[7px] font-mono font-bold text-blue-100 leading-none">HSRP</span>
              </div>

              {/* Input with JetBrains Mono */}
              <input
                value={plate}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="ENTER PLATE (E.G. UP14 AN 7225)"
                spellCheck={false}
                className="w-full bg-transparent px-3 py-2 font-mono text-base sm:text-lg font-bold tracking-widest text-slate-950 placeholder-slate-400 outline-none uppercase min-w-0"
              />

              {/* Security Hologram & Clear Button */}
              <div className="flex items-center gap-1.5 pr-2.5 shrink-0">
                <div
                  title="HSRP Security Chip"
                  className="hidden sm:flex h-6 w-6 rounded-xs items-center justify-center bg-amber-400 text-xs border border-amber-500 font-bold select-none text-slate-950"
                >
                  🇮🇳
                </div>
                {plate && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-xs p-1 text-sm font-bold text-slate-600 hover:text-slate-950 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Live RTO / Vicinity Identification Pill */}
            {activeRto ? (
              <div className="mt-2 flex items-center gap-2 rounded bg-sky-50 border border-sky-300 px-2.5 py-1 text-xs font-mono text-sky-900 animate-fadeIn">
                <span className="h-2 w-2 rounded-full bg-sky-600 animate-pulse" />
                <span className="font-bold">{activeRto.code}</span>
                <span className="text-slate-600">·</span>
                <span className="truncate">{activeRto.city} ({activeRto.state})</span>
              </div>
            ) : plate.trim() ? (
              <div className="mt-2 flex items-center gap-2 rounded bg-amber-50 border border-amber-300 px-2.5 py-1 text-xs font-mono text-amber-900">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Custom Target · All-India Search Active</span>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 rounded bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-mono text-slate-600">
                <span>Whole India View · Enter plate or select preset to zoom to vicinity</span>
              </div>
            )}
          </div>

          {/* Preset Target Scenarios */}
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Preset Scenarios:
            </div>
            <div className="flex flex-col gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.plate}
                  type="button"
                  onClick={() => handlePresetClick(preset.plate)}
                  className={`group flex items-center justify-between rounded-md border px-3 py-2 text-left transition-all cursor-pointer ${
                    plate === preset.plate
                      ? "border-slate-800 bg-slate-100 text-slate-950 font-bold"
                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-400 font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono font-bold text-slate-950 text-xs sm:text-sm shrink-0">
                      {preset.plate}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-700 font-medium truncate">
                      {preset.desc}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs font-bold uppercase shrink-0 ml-1.5 ${
                      preset.tag === "DEMO TARGET"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-200 text-slate-900 border border-slate-300"
                    }`}
                  >
                    {preset.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tracking Mode */}
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Reconstruction Mode:
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`h-11 sm:h-12 flex flex-col items-center justify-center rounded-md border px-1.5 py-1 text-center transition-all cursor-pointer ${
                    mode === m.value
                      ? "border-slate-900 bg-slate-900 text-white font-bold"
                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-400 font-semibold"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold tracking-tight leading-tight truncate max-w-full">
                    {m.label}
                  </span>
                  <span className={`text-[9px] font-mono font-semibold leading-tight truncate max-w-full mt-0.5 ${mode === m.value ? "text-slate-200" : "text-slate-600"}`}>
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tactical Popped-Up Push Button */}
          <button
            type="submit"
            disabled={isSearching || !plate.trim()}
            className="neo-btn mt-1 flex w-full items-center justify-center gap-2 py-3 sm:py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Scanning Sensor Mesh…</span>
              </>
            ) : (
              <>
                <span>⚡ Reconstruct 3D Trajectory</span>
              </>
            )}
          </button>
        </div>
      </form>
    </TiltCard3D>
  );
}
