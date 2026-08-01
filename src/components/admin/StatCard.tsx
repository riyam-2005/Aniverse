export default function StatCard({
  label,
  value,
  change,
  sublabel,
}: {
  label: string;
  value: string | number;
  /** Percent change vs. the prior period, or null/undefined to hide it. */
  change?: number | null;
  sublabel?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-3xl text-ink">{value}</p>
      {typeof change === "number" && (
        <p className={`mt-1 text-xs font-mono ${change >= 0 ? "text-cyan" : "text-pink"}`}>
          {change >= 0 ? "+" : ""}
          {change}% vs prior 7d
        </p>
      )}
      {sublabel && <p className="mt-1 text-xs text-ink-faint">{sublabel}</p>}
    </div>
  );
}
