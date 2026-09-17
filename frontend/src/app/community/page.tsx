import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/core/clients/supabase-server";
import { getAnimeById } from "@/core/clients/jikan";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community — AniVerse",
  description: "Real, recent discussion happening across AniVerse — no filler, just what people are actually saying.",
};

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function CommunityPage() {
  const supabase = createClient();
  const { data: recentComments } = await supabase
    .from("comments")
    .select("id, content, created_at, mal_id, user_id, profiles(id, username, display_name, avatar_url)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  const comments = recentComments || [];
  const uniqueIds = Array.from(new Set(comments.map((c) => c.mal_id)));
  const animeMap = new Map<number, { title: string; image: string | null }>();

  await Promise.all(
    uniqueIds.map(async (id) => {
      const anime = await getAnimeById(id);
      if (anime) {
        animeMap.set(id, {
          title: anime.title_english || anime.title,
          image: anime.images?.jpg?.image_url ?? null,
        });
      }
    })
  );

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <p className="eyebrow mb-1.5">Live Discussions</p>
        <h1 className="font-display text-4xl tracking-wide text-ink">Community Pulse</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-dim">
          Recent comments and thoughts shared by AniVerse members across all anime titles.
        </p>
      </div>

      {comments.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel px-6 py-12 text-center">
          <p className="text-sm text-ink-dim">
            No discussion yet — comments from any anime page will show up here as soon as people start posting.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((c: any) => {
            const anime = animeMap.get(c.mal_id);
            const authorName = c.profiles?.display_name || c.profiles?.username || "Anime Fan";

            return (
              <div
                key={c.id}
                className="flex gap-4 rounded-2xl border border-line bg-panel p-4 hover:border-cyan/40 transition-colors"
              >
                {anime?.image && (
                  <Link href={`/anime/${c.mal_id}`} className="shrink-0">
                    <div className="relative h-20 w-14 overflow-hidden rounded-xl border border-line bg-panel2">
                      <Image
                        src={anime.image}
                        alt={anime.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-ink">{authorName}</span>
                    <span className="text-xs text-ink-faint">commented on</span>
                    <Link
                      href={`/anime/${c.mal_id}`}
                      className="text-sm text-cyan hover:underline font-medium"
                    >
                      {anime?.title ?? `#${c.mal_id}`}
                    </Link>
                    <span className="font-mono text-[11px] text-ink-faint">
                      · {timeAgo(new Date(c.created_at))}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-dim">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
