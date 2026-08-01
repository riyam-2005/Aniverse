/**
 * Pure aggregation helpers for the /admin/analytics dashboard. Kept
 * separate from the page component (which does the Prisma queries) so
 * this logic can be unit tested without a database.
 */

/** Percent change from `previous` to `current`, rounded to one decimal.
 * Returns null when there's no meaningful baseline (previous === 0) —
 * "+infinity%" isn't a useful number to show, so the caller should render
 * "New" or similar instead. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Buckets a list of ISO/Date timestamps into counts-per-day for the
 * trailing `days` days (oldest first), inclusive of today. Days with no
 * events still get an entry with count 0, so charts don't have gaps. */
export function bucketByDay(
  timestamps: Array<Date | string>,
  days: number,
  now: Date = new Date()
): Array<{ date: string; count: number }> {
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.set(dayKey(d), 0);
  }

  for (const ts of timestamps) {
    const d = typeof ts === "string" ? new Date(ts) : ts;
    const key = dayKey(d);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

/** Parses the comma-separated `preferredGenres` mal_id strings stored on
 * User and returns the most common genre ids, most-popular first. */
export function topGenreIds(
  preferredGenresList: string[],
  limit = 5
): Array<{ genreId: number; count: number }> {
  const counts = new Map<number, number>();

  for (const raw of preferredGenresList) {
    for (const part of raw.split(",")) {
      const id = Number(part.trim());
      if (!Number.isFinite(id) || id <= 0) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([genreId, count]) => ({ genreId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
