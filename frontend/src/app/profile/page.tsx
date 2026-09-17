import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, getProfile, createClient } from "@/core/clients/supabase-server";
import { syncUserBadges } from "@/features/dna-engine/badges.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Profile — AniVerse",
  description: "View your personal anime profile, badges, stats, and activity.",
};

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?callbackUrl=/app/profile");
  }

  const supabase = createClient();

  const [profile, libraryRes, historyRes, badges] = await Promise.all([
    getProfile(user.id),
    supabase.from("user_anime").select("status, current_episode, total_episodes, score").eq("user_id", user.id),
    supabase.from("watch_history").select("*, anime(*)").eq("user_id", user.id).order("watched_at", { ascending: false }).limit(6),
    syncUserBadges(user.id),
  ]);

  const library = libraryRes.data ?? [];
  const history = historyRes.data ?? [];

  const statsMap: Record<string, number> = {
    WATCHING: 0,
    COMPLETED: 0,
    PLAN_TO_WATCH: 0,
    ON_HOLD: 0,
    DROPPED: 0,
  };

  let totalEpisodes = 0;
  for (const item of library) {
    if (statsMap[item.status] !== undefined) {
      statsMap[item.status]++;
    }
    totalEpisodes += item.current_episode || 0;
  }

  const totalHours = Math.round((totalEpisodes * 23.5) / 60);

  return (
    <main className="container-page py-10 space-y-8">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel p-8 sm:p-10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-pink text-3xl font-bold text-slate-950 shadow-lg">
              {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl sm:text-4xl text-ink">
                  {profile?.display_name || profile?.username || "Anime Fan"}
                </h1>
                {profile?.role === "ADMIN" && (
                  <span className="rounded-full bg-pink/20 px-3 py-0.5 text-xs font-mono text-pink border border-pink/30 font-semibold">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-dim">@{profile?.username || "user"}</p>
              <p className="mt-1 text-xs text-ink-faint">
                Member since{" "}
                {new Date(user.created_at || Date.now()).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/app/anime-dna" className="btn-secondary text-xs">
              🧬 View Anime DNA
            </Link>
            <Link href="/app/library" className="btn-primary text-xs">
              My Library
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-panel p-5 text-center">
          <p className="font-display text-3xl sm:text-4xl text-cyan">{library.length}</p>
          <p className="mt-1 font-mono text-xs text-ink-dim uppercase">Total in Library</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 text-center">
          <p className="font-display text-3xl sm:text-4xl text-emerald-400">{statsMap.COMPLETED}</p>
          <p className="mt-1 font-mono text-xs text-ink-dim uppercase">Completed</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 text-center">
          <p className="font-display text-3xl sm:text-4xl text-pink">{totalEpisodes}</p>
          <p className="mt-1 font-mono text-xs text-ink-dim uppercase">Episodes Watched</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5 text-center">
          <p className="font-display text-3xl sm:text-4xl text-amber-400">{totalHours} hrs</p>
          <p className="mt-1 font-mono text-xs text-ink-dim uppercase">Time Streamed</p>
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="rounded-2xl border border-line bg-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">Achievements ({badges.length})</h2>
          <span className="text-xs font-mono text-cyan">Auto-synced</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((b) => (
            <div
              key={b.key}
              className="flex items-center gap-3.5 rounded-xl bg-panel2/60 p-4 border border-line/60"
            >
              <span className="text-3xl">{b.icon}</span>
              <div>
                <h3 className="font-semibold text-sm text-ink">{b.label}</h3>
                <p className="text-xs text-ink-dim">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent History */}
      <div className="rounded-2xl border border-line bg-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink">Recent Watch Activity</h2>
          <Link href="/app/history" className="text-xs font-mono text-cyan hover:underline">
            Full history →
          </Link>
        </div>

        {history.length > 0 ? (
          <div className="divide-y divide-line/60">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm text-ink">{h.anime?.title || `Anime #${h.mal_id}`}</p>
                  <p className="text-xs text-ink-dim">Episode {h.episode_number}</p>
                </div>
                <span className="text-xs font-mono text-ink-faint">
                  {new Date(h.watched_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-dim">No recent watch activity.</p>
        )}
      </div>
    </main>
  );
}
