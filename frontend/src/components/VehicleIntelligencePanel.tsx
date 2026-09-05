import type { TrajectoryResponseDto, VehicleSummaryDto } from "@/lib/api";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatDistanceKm, formatDurationMinutes, formatTimestamp } from "@/lib/format";

interface VehicleIntelligencePanelProps {
  summary: VehicleSummaryDto;
  trajectory: TrajectoryResponseDto | null;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-100">{value ?? "—"}</div>
    </div>
  );
}

export function VehicleIntelligencePanel({ summary, trajectory }: VehicleIntelligencePanelProps) {
  const { vehicle } = summary;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-lg font-semibold tracking-wider text-zinc-50">{vehicle.plate}</h2>
        {trajectory?.overallConfidence != null && (
          <ConfidenceBadge value={trajectory.overallConfidence} label="Trajectory" />
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-3">
        <Field label="Type" value={vehicle.vehicleType} />
        <Field label="Color" value={vehicle.color} />
        <Field label="Make" value={vehicle.make} />
        <Field label="Model" value={vehicle.model} />
        <Field label="First Seen" value={formatTimestamp(summary.firstSeen)} />
        <Field label="Last Seen" value={formatTimestamp(summary.lastSeen)} />
        <Field label="Cameras" value={summary.cameraCount} />
        <Field label="Detections" value={summary.detectionCount} />
        <Field label="Distance" value={trajectory ? formatDistanceKm(trajectory.estimatedDistanceKm) : "—"} />
        <Field
          label="Travel Time"
          value={trajectory ? formatDurationMinutes(trajectory.estimatedDurationMinutes) : "—"}
        />
      </div>

      {trajectory?.warning && (
        <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-300">
          {trajectory.warning}
        </div>
      )}
    </div>
  );
}
