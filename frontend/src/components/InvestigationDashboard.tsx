"use client";

import { useEffect, useState } from "react";
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
import { VehicleSearchPanel } from "./VehicleSearchPanel";
import { VehicleIntelligencePanel } from "./VehicleIntelligencePanel";
import { DetectionTimeline } from "./DetectionTimeline";
import { EvidenceViewer } from "./EvidenceViewer";
import { InvestigationMap } from "./InvestigationMap";

type SearchState = "idle" | "searching" | "found" | "not-found" | "error";

export function InvestigationDashboard() {
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<VehicleSummaryDto | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryResponseDto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [replayToken, setReplayToken] = useState(0);

  useEffect(() => {
    getCameras()
      .then(setCameras)
      .catch(() => setCameras([]));
  }, []);

  async function handleSearch(plate: string) {
    setSearchState("searching");
    setErrorMessage(null);
    setSummary(null);
    setTrajectory(null);
    setSelectedIndex(null);

    try {
      const summaryResult = await getVehicleSummary(plate);
      setSummary(summaryResult);

      try {
        const trajectoryResult = await getVehicleTrajectory(plate);
        setTrajectory(trajectoryResult);
        if (trajectoryResult.points.length > 0) setSelectedIndex(0);
      } catch {
        // Summary succeeded but trajectory failed (shouldn't normally happen) -
        // still show what we have rather than a hard error.
        setTrajectory(null);
      }

      setSearchState("found");
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

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr_360px]">
      <div className="flex flex-col gap-4">
        <VehicleSearchPanel onSearch={handleSearch} isSearching={searchState === "searching"} />

        <AnimatePresence mode="wait">
          {searchState === "not-found" && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400"
            >
              No vehicle found for this registration number. It may not have been observed by any camera in the
              network, or the plate wasn&apos;t entered exactly as registered.
            </motion.div>
          )}
          {searchState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
            >
              {errorMessage ?? "Something went wrong."}
            </motion.div>
          )}
          {searchState === "found" && summary && (
            <motion.div key="found" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <VehicleIntelligencePanel summary={summary} trajectory={trajectory} />
            </motion.div>
          )}
        </AnimatePresence>

        {points.length >= 2 && (
          <button
            type="button"
            onClick={() => setReplayToken((n) => n + 1)}
            className="rounded border border-zinc-700 bg-zinc-900/60 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-sky-500 hover:text-sky-300"
          >
            ▶ Replay Trajectory
          </button>
        )}
      </div>

      <div className="min-h-[420px] overflow-hidden rounded-lg border border-zinc-800">
        <InvestigationMap
          cameras={cameras}
          points={points}
          selectedIndex={selectedIndex}
          onSelectPoint={setSelectedIndex}
          replayToken={replayToken}
        />
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto">
        <DetectionTimeline points={points} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <EvidenceViewer point={selectedPoint} />
      </div>
    </div>
  );
}
