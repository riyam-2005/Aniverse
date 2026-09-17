/**
 * A plain CSS bar chart — deliberately not pulling in a charting library
 * for a handful of admin-only bars. Renders 30 daily bars scaled to the
 * max value in the series.
 */
export default function DailyBarChart({
  title,
  series,
  colorClass = "bg-cyan",
}: {
  title: string;
  series: Array<{ date: string; count: number }>;
  colorClass?: string;
}) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const total = series.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <span className="font-mono text-xs text-ink-faint">{total} total</span>
      </div>
      <div className="flex h-32 gap-[2px] rounded-xl border border-line bg-panel p-3">
        {series.map((point) => (
          <div
            key={point.date}
            className="group flex h-full flex-1 flex-col justify-end"
            title={`${point.date}: ${point.count}`}
          >
            <div
              className={`w-full rounded-sm ${colorClass} opacity-70 transition-opacity group-hover:opacity-100`}
              style={{ height: `${Math.max(2, (point.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
