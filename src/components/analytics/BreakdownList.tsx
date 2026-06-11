import { formatNumber } from "@/lib/format";
import type { BreakdownRow } from "@/lib/stats";

interface BreakdownListProps {
  rows: BreakdownRow[];
  emptyLabel: string;
  /** Tailwind gradient classes for the proportional bars. */
  barClass?: string;
}

/**
 * Label + proportional bar + count. Server-renderable — no chart library
 * needed for simple ranked breakdowns.
 */
export function BreakdownList({
  rows,
  emptyLabel,
  barClass = "from-violet-500/80 to-fuchsia-500/60",
}: BreakdownListProps) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">{emptyLabel}</p>;
  }

  const max = Math.max(...rows.map((row) => row.clicks));

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-300">{row.label}</span>
            <span className="shrink-0 font-semibold text-white">
              {formatNumber(row.clicks)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barClass}`}
              style={{ width: `${Math.max(2, (row.clicks / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
