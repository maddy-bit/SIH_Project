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
    <div className="card-3d-light rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/40 p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-sky-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">🔮</span>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Trajectory Predictor
            </h3>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center text-xs font-mono text-slate-500 animate-pulse">
            Computing Spatial Probabilities...
          </div>
        ) : (
          displayCandidates.map((cand, idx) => (
            <motion.div
              key={cand.nextCameraId || idx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/90 p-2.5 shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black font-mono shadow-xs ${
                    idx === 0
                      ? "bg-sky-500 text-white"
                      : idx === 1
                      ? "bg-slate-200 text-slate-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  #{idx + 1}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">{cand.nextCameraName}</p>
                  <p className="text-[10px] font-mono text-slate-500">
                    ID: {cand.nextCameraId} • ETA ~{Math.round(cand.estimatedTravelSeconds / 60)}m
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black font-mono text-sky-700">
                  {Math.round(cand.probability * 100)}%
                </span>
                {cand.estimatedArrivalIso && (
                  <p className="text-[9px] font-mono text-slate-400">{cand.estimatedArrivalIso}</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
