"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TrajectoryPointDto } from "@/lib/api";
import { evidenceImageUrl } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatTimestamp } from "@/lib/format";

interface EvidenceViewerProps {
  point: TrajectoryPointDto | null;
}

export function EvidenceViewer({ point }: EvidenceViewerProps) {
  const imageUrl = evidenceImageUrl(point?.imagePath);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Camera Evidence</h2>

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
            <div className="overflow-hidden rounded border border-zinc-800 bg-black">
              {imageUrl ? (
                // Evidence frames are backend-served local files, not a static asset set.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={`Evidence frame from ${point.cameraId}`} className="w-full object-contain" />
              ) : (
                <div className="flex h-40 items-center justify-center text-xs text-zinc-600">
                  No evidence frame available
                </div>
              )}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-zinc-500">Camera</dt>
              <dd className="text-right text-zinc-200">{point.cameraId} — {point.cameraName}</dd>
              <dt className="text-zinc-500">Timestamp</dt>
              <dd className="text-right text-zinc-200">{formatTimestamp(point.timestamp)}</dd>
              <dt className="text-zinc-500">Plate confidence</dt>
              <dd className="text-right"><ConfidenceBadge value={point.plateConfidence} /></dd>
              <dt className="text-zinc-500">Detection confidence</dt>
              <dd className="text-right"><ConfidenceBadge value={point.detectionConfidence} /></dd>
              {point.incomingTransitionConfidence != null && (
                <>
                  <dt className="text-zinc-500">Match confidence</dt>
                  <dd className="text-right"><ConfidenceBadge value={point.incomingTransitionConfidence} /></dd>
                </>
              )}
            </dl>
          </motion.div>
        ) : (
          <p className="mt-3 text-xs text-zinc-600">Select a timeline event or a camera marker on the map.</p>
        )}
      </AnimatePresence>
    </div>
  );
}
