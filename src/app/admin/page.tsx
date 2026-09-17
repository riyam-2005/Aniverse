import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/core/clients/supabase-server";
import { getJikanHealth } from "@/core/clients/jikan";
import { percentChange } from "@/features/admin/analytics.service";
import StatCard from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard — AniVerse",
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
  const last7 = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const prev7 = new Date(now.getTime() - 14 * DAY_MS).toISOString();

  const supabase = createClient();

  const [
    totalUsersRes,
    newUsers7Res,
    newUsersPrev7Res,
    totalLibraryRes,
    totalCommentsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", last7),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", prev7).lt("created_at", last7),
    supabase.from("user_anime").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true }),
  ]);

  const totalUsers = totalUsersRes.count || 0;
  const newUsers7 = newUsers7Res.count || 0;
  const newUsersPrev7 = newUsersPrev7Res.count || 0;
  const totalWatchlistItems = totalLibraryRes.count || 0;
  const totalComments = totalCommentsRes.count || 0;

  const dbOk = !totalUsersRes.error;
  const jikan = await getJikanHealth().catch(() => null);
  const jikanOk = jikan?.status !== "down";
  const overallOk = dbOk && jikanOk;

  return (
    <div>
      <p className="eyebrow mb-1.5">Administration</p>
      <h1 className="font-display text-4xl tracking-wide text-ink">Control Center</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-dim">
        Real-time telemetry on user accounts, database health, content activity, and AI utilization.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-3">
        <StatusDot ok={overallOk} />
        <p className="text-sm text-ink font-medium">
          {overallOk ? "All backend systems operational." : "Attention needed on external services."}
        </p>
        <span className="ml-auto flex items-center gap-4 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5">
            <StatusDot ok={dbOk} /> Supabase DB
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
        <StatCard label="Library Items" value={totalWatchlistItems} />
        <StatCard label="Comments" value={totalComments} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-cyan/50 hover:bg-panel2 shadow-sm"
        >
          <p className="font-display text-xl text-ink">Users →</p>
          <p className="mt-1 text-sm text-ink-dim">
            Browse registered profiles, roles, and moderation tools.
          </p>
        </Link>
        <Link
          href="/admin/analytics"
          className="rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-cyan/50 hover:bg-panel2 shadow-sm"
        >
          <p className="font-display text-xl text-ink">Analytics →</p>
          <p className="mt-1 text-sm text-ink-dim">
            Signup growth, library additions, and review statistics.
          </p>
        </Link>
        <Link
          href="/admin/monitoring"
          className="rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-cyan/50 hover:bg-panel2 shadow-sm"
        >
          <p className="font-display text-xl text-ink">Monitoring →</p>
          <p className="mt-1 text-sm text-ink-dim">
            Live database latency, circuit breaker metrics, and API health.
          </p>
        </Link>
      </div>
    </div>
  );
}
