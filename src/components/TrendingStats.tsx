import type { Anime } from "@/types/anime";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl tracking-wide text-ink">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-ink-dim">{sub}</p>}
    </div>
  );
}

/**
 * Computed entirely from the anime already fetched for the current
 * page/tab — no extra Jikan calls, so it costs nothing beyond the render.
 */
export default function TrendingStats({ items }: { items: Anime[] }) {
  if (items.length === 0) return null;

  const scored = items.filter((a) => typeof a.score === "number");
  const avgScore = scored.length
    ? (scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length).toFixed(2)
    : "—";

  const genreCounts = new Map<string, number>();
  for (const a of items) {
    for (const g of a.genres ?? []) {
      genreCounts.set(g.name, (genreCounts.get(g.name) ?? 0) + 1);
    }
  }
  const topGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const mostVoted = items.reduce<Anime | null>((best, a) => {
    if (!a.scored_by) return best;
    if (!best || (a.scored_by ?? 0) > (best.scored_by ?? 0)) return a;
    return best;
  }, null);

  const totalVotes = items.reduce((sum, a) => sum + (a.scored_by ?? 0), 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Avg. score" value={avgScore} sub={`across ${items.length} titles`} />
      <StatCard
        label="Top genre"
        value={topGenre ? topGenre[0] : "—"}
        sub={topGenre ? `${topGenre[1]} of ${items.length} titles` : undefined}
      />
      <StatCard
        label="Most voted"
        value={mostVoted?.score?.toFixed(1) ?? "—"}
        sub={mostVoted?.title}
      />
      <StatCard label="Total votes" value={totalVotes.toLocaleString()} sub="on this page" />
    </div>
  );
}
