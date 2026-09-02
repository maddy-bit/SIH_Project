"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export type SearchMode = "historical" | "live" | "combined";

interface VehicleSearchPanelProps {
  onSearch: (plate: string) => void;
  isSearching: boolean;
}

const MODES: { value: SearchMode; label: string; enabled: boolean }[] = [
  { value: "historical", label: "Historical", enabled: true },
  { value: "live", label: "Live", enabled: false },
  { value: "combined", label: "Historical + Live", enabled: false },
];

export function VehicleSearchPanel({ onSearch, isSearching }: VehicleSearchPanelProps) {
  const [plate, setPlate] = useState("MH12AB1234");
  const [mode, setMode] = useState<SearchMode>("historical");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plate.trim()) return;
    onSearch(plate.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Vehicle Search</h2>

      <label className="mt-3 block text-[11px] uppercase tracking-wide text-zinc-500">
        Vehicle Registration Number
      </label>
      <input
        value={plate}
        onChange={(e) => setPlate(e.target.value.toUpperCase())}
        placeholder="MH12AB1234"
        spellCheck={false}
        className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm tracking-wider text-zinc-100 outline-none focus:border-sky-500"
      />

      <div className="mt-3 flex gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            disabled={!m.enabled}
            onClick={() => m.enabled && setMode(m.value)}
            title={m.enabled ? undefined : "Coming in a later phase"}
            className={`flex-1 rounded border px-2 py-1.5 text-[11px] font-medium transition-colors ${
              mode === m.value
                ? "border-sky-500 bg-sky-500/15 text-sky-300"
                : "border-zinc-800 text-zinc-500"
            } ${m.enabled ? "cursor-pointer hover:border-zinc-600" : "cursor-not-allowed opacity-50"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <motion.button
        type="submit"
        disabled={isSearching || !plate.trim()}
        whileTap={{ scale: 0.98 }}
        className="mt-4 w-full rounded bg-sky-500 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
      >
        {isSearching ? "SEARCHING…" : "SEARCH VEHICLE"}
      </motion.button>
    </form>
  );
}
