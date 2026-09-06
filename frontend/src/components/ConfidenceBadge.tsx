import { formatConfidence } from "@/lib/format";

interface ConfidenceBadgeProps {
  value: number | null | undefined;
  label?: string;
  size?: "sm" | "md";
}

export function ConfidenceBadge({ value, label, size = "sm" }: ConfidenceBadgeProps) {
  if (value == null) {
    return <span className="text-[11px] font-mono text-slate-400">—</span>;
  }

  const pct = Math.round(value * 100);
  let color = "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-xs";
  let dotColor = "bg-emerald-500 shadow-xs";

  if (pct < 60) {
    color = "border-rose-200 bg-rose-50 text-rose-700 shadow-xs";
    dotColor = "bg-rose-500 shadow-xs";
  } else if (pct < 80) {
    color = "border-amber-200 bg-amber-50 text-amber-700 shadow-xs";
    dotColor = "bg-amber-500 shadow-xs";
  }

  const padding = size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-bold tracking-tight ${color} ${padding}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label && <span className="text-[10px] uppercase tracking-wider opacity-85 font-sans font-bold">{label}</span>}
      <span>{formatConfidence(value)}</span>
    </span>
  );
}
