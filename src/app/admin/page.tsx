import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getJikanHealth } from "@/lib/jikan";
import { percentChange } from "@/lib/analytics";
import StatCard from "@/components/admin/StatCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Admin — AniVerse",
  robots: { index: false, follow: false },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-cyan" : "bg-pink"}`}
      aria-hidden
    />
  );
}

export default async function AdminHomePage() {
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * DAY_MS);
  const prev7 = new Date(now.getTime() - 14 * DAY_MS);

  const [totalUsers, newUsers7, newUsersPrev7, totalWatchlistItems, totalComments] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last7 } } }),
      prisma.user.count({ where: { createdAt: { gte: prev7, lt: last7 } } }),
      prisma.watchlistItem.count(),
      prisma.comment.count(),
    ]);

  const dbOk = await prisma.$queryRaw`SELECT 1`.then(
    () => true,
    () => false
  );
  const jikan = await getJikanHealth().catch(() => null);
  const jikanOk = jikan?.status !== "down";
  const overallOk = dbOk && jikanOk;

  return (
    <div>
      <p className="eyebrow mb-1.5">Admin</p>
      <h1 className="font-display text-4xl tracking-wide text-ink">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-dim">
        A quick pulse on the site. For the full picture, head into Analytics or Monitoring.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-3">
        <StatusDot ok={overallOk} />
        <p className="text-sm text-ink">
          {overallOk ? "Everything's healthy." : "Something needs attention."}
        </p>
        <span className="ml-auto flex items-center gap-3 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5">
            <StatusDot ok={dbOk} /> Database
          </span>
          <span className="flex items-center gap-1.5">
            <StatusDot ok={jikanOk} /> Jikan API
          </span>
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} />
        <StatCard
          label="New users (7d)"
          value={newUsers7}
          change={percentChange(newUsers7, newUsersPrev7)}
        />
        <StatCard label="Watchlist items" value={totalWatchlistItems} />
        <StatCard label="Comments" value={totalComments} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/analytics"
          className="rounded-xl border border-line bg-panel p-5 transition-colors hover:border-cyan/50 hover:bg-panel2"
        >
          <p className="font-display text-xl text-ink">Analytics →</p>
          <p className="mt-1 text-sm text-ink-dim">
            Signup, comment, and watchlist trends; review scores; top genres.
          </p>
        </Link>
        <Link
          href="/admin/monitoring"
          className="rounded-xl border border-line bg-panel p-5 transition-colors hover:border-cyan/50 hover:bg-panel2"
        >
          <p className="font-display text-xl text-ink">Monitoring →</p>
          <p className="mt-1 text-sm text-ink-dim">
            Live DB/Jikan status, circuit breaker state, latency, and process metrics.
          </p>
        </Link>
      </div>
    </div>
  );
}
