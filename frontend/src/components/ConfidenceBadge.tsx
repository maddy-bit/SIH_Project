import { confidenceTone, formatConfidence } from "@/lib/format";

const TONE_CLASSES: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  none: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export function ConfidenceBadge({ value, label }: { value: number | null | undefined; label?: string }) {
  const tone = confidenceTone(value);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${TONE_CLASSES[tone]}`}
    >
      {label ? `${label} ` : ""}
      {formatConfidence(value)}
    </span>
  );
}
