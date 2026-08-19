import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncUserBadges } from "@/lib/badges";

export const metadata: Metadata = {
  title: "My Profile & Achievements | AniVerse",
  description: "View your watch history, watchlist statistics, and unlocked achievements.",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const [user, watchlistStats, history, badges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true, preferredGenres: true, role: true },
    }),
    prisma.watchlistItem.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    }),
    prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: "desc" },
      take: 8,
      include: { anime: true },
    }),
    syncUserBadges(userId),
  ]);

  const statsMap = watchlistStats.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  const totalTitles = Object.values(statsMap).reduce((a, b) => a + b, 0);

  return (
    <main className="container-page py-10">
      {/* Profile Header */}
      <div className="rounded-2xl border border-paper-border bg-paper-light p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-magenta text-3xl font-bold text-slate-950 shadow-lg">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl text-ink">{user?.name}</h1>
                {user?.role === "ADMIN" && (
                  <span className="rounded-full bg-magenta/20 px-3 py-0.5 text-xs font-semibold text-magenta">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-dim">{user?.email}</p>
              <p className="mt-1 text-xs text-ink-faint">
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Achievements Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Watchlist Stats */}
        <div className="rounded-2xl border border-paper-border bg-paper-light p-6">
          <h2 className="eyebrow mb-4">Watchlist Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-paper-hover p-4 text-center">
              <p className="text-2xl font-bold text-cyan">{totalTitles}</p>
              <p className="text-xs text-ink-dim mt-1">Total Titles</p>
            </div>
            <div className="rounded-xl bg-paper-hover p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{statsMap["COMPLETED"] || 0}</p>
              <p className="text-xs text-ink-dim mt-1">Completed</p>
            </div>
            <div className="rounded-xl bg-paper-hover p-4 text-center">
              <p className="text-2xl font-bold text-magenta">{statsMap["WATCHING"] || 0}</p>
              <p className="text-xs text-ink-dim mt-1">Watching</p>
            </div>
            <div className="rounded-xl bg-paper-hover p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{statsMap["PLANNING"] || 0}</p>
              <p className="text-xs text-ink-dim mt-1">Planning</p>
            </div>
          </div>
        </div>

        {/* Achievements / Badges */}
        <div className="lg:col-span-2 rounded-2xl border border-paper-border bg-paper-light p-6">
          <h2 className="eyebrow mb-4">Unlocked Achievements ({badges.length})</h2>
          {badges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badges.map((b) => (
                <div key={b.key} className="flex items-center gap-3.5 rounded-xl bg-paper-hover p-4 border border-paper-border/50">
                  <span className="text-3xl">{b.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm text-ink">{b.label}</h3>
                    <p className="text-xs text-ink-dim">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-dim">Watch titles and review anime to unlock achievements!</p>
          )}
        </div>
      </div>

      {/* Watch History Timeline */}
      <div className="mt-8 rounded-2xl border border-paper-border bg-paper-light p-6">
        <h2 className="eyebrow mb-4">Recent Watch History</h2>
        {history.length > 0 ? (
          <div className="divide-y divide-paper-border">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm text-ink">{h.anime?.title || `Anime #${h.malId}`}</p>
                  <p className="text-xs text-ink-dim">Episode {h.episodeNumber}</p>
                </div>
                <span className="text-xs text-ink-faint">
                  {new Date(h.watchedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-dim">No watch history recorded yet.</p>
        )}
      </div>
    </main>
  );
}
