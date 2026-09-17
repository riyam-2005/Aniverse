import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/core/clients/supabase-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Watch History — AniVerse",
  description: "View your complete anime watch and episode history log.",
  robots: { index: false },
};

export default async function WatchHistoryPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?callbackUrl=/app/history");
  }

  const supabase = createClient();
  const { data: history } = await supabase
    .from("watch_history")
    .select("*, anime(*)")
    .eq("user_id", user.id)
    .order("watched_at", { ascending: false })
    .limit(50);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <p className="eyebrow mb-1">Playback Timeline</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink">
          Watch <span className="text-pink">History</span>
        </h1>
      </div>

      {!history || history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-20 text-center bg-panel/30">
          <p className="text-ink-dim text-sm">No watch history recorded yet.</p>
          <Link href="/trending" className="btn-primary mt-4 inline-flex text-xs">
            Start Watching Anime
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-panel p-6">
          <div className="divide-y divide-line/60">
            {history.map((entry) => {
              const animeTitle = entry.anime?.title || `Anime #${entry.mal_id}`;
              const dateStr = new Date(entry.watched_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={entry.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel2 font-mono text-xs text-cyan border border-line">
                      Ep {entry.episode_number}
                    </div>
                    <div>
                      <Link
                        href={`/anime/${entry.mal_id}`}
                        className="font-semibold text-sm text-ink hover:text-cyan transition-colors"
                      >
                        {animeTitle}
                      </Link>
                      <p className="text-xs text-ink-dim mt-0.5">
                        Episode {entry.episode_number}
                        {entry.progress_seconds > 0
                          ? ` · ${Math.floor(entry.progress_seconds / 60)} min played`
                          : " logged"}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-xs text-ink-faint">{dateStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
