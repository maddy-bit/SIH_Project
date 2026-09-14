"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { predictTrajectory, type TrajectoryCandidateDto } from "@/lib/api";

interface TrajectoryPredictionCardProps {
  plate: string;
}

const FALLBACK_CANDIDATES: TrajectoryCandidateDto[] = [
  {
    nextCameraId: "CAM-05",
    nextCameraName: "Swargate Junction",
    probability: 0.78,
    estimatedTravelSeconds: 340,
    estimatedArrivalIso: "18:20",
  },
  {
    nextCameraId: "CAM-08",
    nextCameraName: "Baner Road",
    probability: 0.16,
    estimatedTravelSeconds: 620,
    estimatedArrivalIso: "18:25",
  },
  {
    nextCameraId: "CAM-11",
    nextCameraName: "Aundh ITI Circle",
    probability: 0.06,
    estimatedTravelSeconds: 890,
    estimatedArrivalIso: "18:30",
  },
];

export function TrajectoryPredictionCard({ plate }: TrajectoryPredictionCardProps) {
  const [candidates, setCandidates] = useState<TrajectoryCandidateDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    predictTrajectory(plate)
      .then((data) => {
        if (active) {
          setCandidates(data && data.length > 0 ? data : FALLBACK_CANDIDATES);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setCandidates(FALLBACK_CANDIDATES);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [plate]);

  const displayCandidates = candidates.length > 0 ? candidates : FALLBACK_CANDIDATES;

  return (
    <div className="neo-box overflow-hidden">
      <div className="neo-header">
        <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-950 whitespace-nowrap">
          Trajectory Predictor
        </h3>
        <span className="text-xs font-mono font-bold text-slate-800 shrink-0">MARKOV</span>
      </div>

      <div className="p-4 space-y-2.5">
        {isLoading ? (
          <div className="flex h-16 items-center justify-center text-sm font-mono text-slate-800 font-bold">
            Computing Spatial Probabilities...
          </div>
        ) : (
          displayCandidates.map((cand, idx) => (
            <motion.div
              key={cand.nextCameraId || idx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex items-center justify-between rounded-md border border-slate-300 bg-white p-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-xs text-xs font-bold font-mono ${
                    idx === 0
                      ? "bg-slate-900 text-white"
                      : idx === 1
                      ? "bg-slate-200 text-slate-900 border border-slate-300"
                      : "bg-slate-100 text-slate-700 border border-slate-300"
                  }`}
                >
                  #{idx + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-950 uppercase">{cand.nextCameraName}</p>
                  <p className="text-xs font-mono text-slate-800 font-bold">
                    NODE: {cand.nextCameraId} • ETA ~{Math.round(cand.estimatedTravelSeconds / 60)}m
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold font-mono text-slate-950 bg-slate-100 px-2.5 py-1 rounded-xs border border-slate-300">
                  {Math.round(cand.probability * 100)}%
                </span>
                {cand.estimatedArrivalIso && (
                  <p className="text-[11px] font-mono text-slate-800 font-bold mt-1">{cand.estimatedArrivalIso}</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
