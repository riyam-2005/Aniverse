import type { Metadata } from "next";
import { createClient } from "@/core/clients/supabase-server";
import { getGenres } from "@/core/clients/jikan";
import { bucketByDay, percentChange, topGenreIds } from "@/features/admin/analytics.service";
import DailyBarChart from "@/components/admin/DailyBarChart";
import StatCard from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics — Admin",
  robots: { index: false, follow: false },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const prev7 = new Date(now.getTime() - 14 * DAY_MS).toISOString();
  const last30 = new Date(now.getTime() - 30 * DAY_MS).toISOString();

  const supabase = createClient();

  const [
    totalUsersRes,
    newUsers7Res,
    newUsersPrev7Res,
    totalLibraryRes,
    libraryItemsRes,
    totalCommentsRes,
    newComments7Res,
    reviewsRes,
    signups30Res,
    comments30Res,
    library30Res,
    genres,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", last7),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", prev7).lt("created_at", last7),
    supabase.from("user_anime").select("id", { count: "exact", head: true }),
    supabase.from("user_anime").select("status"),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true }).gte("created_at", last7),
    supabase.from("reviews").select("rating"),
    supabase.from("profiles").select("created_at").gte("created_at", last30),
    supabase.from("comments").select("created_at").gte("created_at", last30),
    supabase.from("user_anime").select("created_at").gte("created_at", last30),
    getGenres().catch(() => []),
  ]);

  const totalUsers = totalUsersRes.count || 0;
  const newUsers7 = newUsers7Res.count || 0;
  const newUsersPrev7 = newUsersPrev7Res.count || 0;
  const totalWatchlistItems = totalLibraryRes.count || 0;
  const totalComments = totalCommentsRes.count || 0;
  const newComments7 = newComments7Res.count || 0;

  const reviews = reviewsRes.data || [];
  const totalReviews = reviews.length;
  const avgReviewScore =
    reviews.length > 0
      ? (reviews.reduce((a, b) => a + (b.rating || 0), 0) / reviews.length).toFixed(1)
      : "—";

  const libraryItems = libraryItemsRes.data || [];
  const statusCounts: Record<string, number> = {};
  for (const item of libraryItems) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  }

  const signupSeries = bucketByDay((signups30Res.data || []).map((u) => new Date(u.created_at)), 30, now);
  const commentSeries = bucketByDay((comments30Res.data || []).map((c) => new Date(c.created_at)), 30, now);
  const watchlistSeries = bucketByDay((library30Res.data || []).map((w) => new Date(w.created_at)), 30, now);

  return (
    <div>
      <p className="eyebrow mb-1.5">Telemetry</p>
      <h1 className="font-display text-4xl tracking-wide text-ink">Platform Analytics</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-dim">
        Comprehensive platform activity metrics queried live from Supabase.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} />
        <StatCard
          label="New users (7d)"
          value={newUsers7}
          change={percentChange(newUsers7, newUsersPrev7)}
        />
        <StatCard label="Library items" value={totalWatchlistItems} />
        <StatCard label="Comments" value={totalComments} sublabel={`+${newComments7} this week`} />
        <StatCard label="Reviews" value={totalReviews} />
        <StatCard label="Avg review score" value={avgReviewScore} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <DailyBarChart title="New signups — last 30 days" series={signupSeries} colorClass="bg-cyan" />
        <DailyBarChart title="New comments — last 30 days" series={commentSeries} colorClass="bg-pink" />
        <DailyBarChart title="Library additions — last 30 days" series={watchlistSeries} colorClass="bg-amber-400" />

        <div className="rounded-2xl border border-line bg-panel p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink">Library Breakdown by Status</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center text-xs font-mono">
                <span className="text-ink-dim">{status}</span>
                <span className="text-cyan font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
