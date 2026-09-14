import { formatConfidence } from "@/lib/format";

interface ConfidenceBadgeProps {
  value: number | null | undefined;
  label?: string;
  size?: "sm" | "md";
}

export function ConfidenceBadge({ value, label, size = "sm" }: ConfidenceBadgeProps) {
  if (value == null) {
    return <span className="text-[11px] font-mono text-neutral-400">—</span>;
  }

  const pct = Math.round(value * 100);
  let color = "bg-emerald-50 text-emerald-700 border-emerald-300";
  const dotColor = "bg-emerald-500";

  if (pct < 60) {
    color = "bg-rose-50 text-rose-700 border-rose-300";
  } else if (pct < 80) {
    color = "bg-amber-50 text-amber-700 border-amber-300";
  }

  const padding = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border font-mono font-bold tracking-tight ${color} ${padding}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label && <span className="uppercase tracking-wider opacity-90 text-[9px] font-mono font-bold">{label}</span>}
      <span>{formatConfidence(value)}</span>
    </span>
  );
}
