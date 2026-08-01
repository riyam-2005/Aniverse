import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getGenres } from "@/lib/jikan";
import { bucketByDay, percentChange, topGenreIds } from "@/lib/analytics";
import DailyBarChart from "@/components/admin/DailyBarChart";
import StatCard from "@/components/admin/StatCard";

export const revalidate = 60;
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Analytics — Admin",
  robots: { index: false, follow: false },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * DAY_MS);
  const prev7 = new Date(now.getTime() - 14 * DAY_MS);
  const last30 = new Date(now.getTime() - 30 * DAY_MS);

  const [
    totalUsers,
    newUsers7,
    newUsersPrev7,
    totalWatchlistItems,
    watchlistByStatus,
    totalComments,
    newComments7,
    totalReviews,
    avgReviewScore,
    signupTimestamps30,
    commentTimestamps30,
    watchlistTimestamps30,
    preferredGenresList,
    genres,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last7 } } }),
    prisma.user.count({ where: { createdAt: { gte: prev7, lt: last7 } } }),
    prisma.watchlistItem.count(),
    prisma.watchlistItem.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { createdAt: { gte: last7 } } }),
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: last30 } }, select: { createdAt: true } }),
    prisma.comment.findMany({ where: { createdAt: { gte: last30 } }, select: { createdAt: true } }),
    prisma.watchlistItem.findMany({ where: { createdAt: { gte: last30 } }, select: { createdAt: true } }),
    prisma.user.findMany({ where: { preferredGenres: { not: "" } }, select: { preferredGenres: true } }),
    getGenres().catch(() => []),
  ]);

  const genreNameById = new Map(genres.map((g) => [g.mal_id, g.name]));
  const topGenres = topGenreIds(preferredGenresList.map((u) => u.preferredGenres)).map((g) => ({
    ...g,
    name: genreNameById.get(g.genreId) ?? `Genre #${g.genreId}`,
  }));

  const signupSeries = bucketByDay(signupTimestamps30.map((u) => u.createdAt), 30, now);
  const commentSeries = bucketByDay(commentTimestamps30.map((c) => c.createdAt), 30, now);
  const watchlistSeries = bucketByDay(watchlistTimestamps30.map((w) => w.createdAt), 30, now);

  return (
    <div>
      <p className="eyebrow mb-1.5">Dashboard</p>
      <h1 className="font-display text-4xl tracking-wide text-ink">Analytics</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-dim">
        Pulled directly from the app database — no separate analytics service required. Page-view
        and traffic-source data lives in Vercel Analytics; this covers everything account- and
        content-related.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} />
        <StatCard
          label="New users (7d)"
          value={newUsers7}
          change={percentChange(newUsers7, newUsersPrev7)}
        />
        <StatCard label="Watchlist items" value={totalWatchlistItems} />
        <StatCard label="Comments" value={totalComments} sublabel={`+${newComments7} this week`} />
        <StatCard label="Reviews" value={totalReviews} />
        <StatCard
          label="Avg review score"
          value={avgReviewScore._avg.rating ? avgReviewScore._avg.rating.toFixed(1) : "—"}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <DailyBarChart title="New signups — last 30 days" series={signupSeries} colorClass="bg-cyan" />
        <DailyBarChart title="New comments — last 30 days" series={commentSeries} colorClass="bg-pink" />
        <DailyBarChart title="Watchlist adds — last 30 days" series={watchlistSeries} colorClass="bg-amber" />

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Watchlist by status</h2>
          <div className="space-y-2 rounded-xl border border-line bg-panel p-4">
            {watchlistByStatus
              .sort((a, b) => b._count.status - a._count.status)
              .map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm">
                  <span className="text-ink-dim">{row.status}</span>
                  <span className="font-mono text-ink">{row._count.status}</span>
                </div>
              ))}
            {watchlistByStatus.length === 0 && (
              <p className="text-sm text-ink-faint">No watchlist activity yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Top genres (from onboarding preferences)
        </h2>
        <div className="space-y-2 rounded-xl border border-line bg-panel p-4">
          {topGenres.length === 0 && (
            <p className="text-sm text-ink-faint">No preference data yet.</p>
          )}
          {topGenres.map((g) => {
            const max = topGenres[0]?.count || 1;
            return (
              <div key={g.genreId} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 text-ink-dim">{g.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel2">
                  <div
                    className="h-full rounded-full bg-cyan"
                    style={{ width: `${(g.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-ink-faint">{g.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
