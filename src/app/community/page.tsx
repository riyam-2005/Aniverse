import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAnimeById } from "@/lib/jikan";

export const revalidate = 60;

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
  const recentComments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true } } },
  });

  // Resolve each unique anime title/poster from Jikan so the feed can show
  // what people are actually talking about, not just a bare ID.
  const uniqueIds = Array.from(new Set(recentComments.map((c) => c.animeMalId)));
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
        <p className="eyebrow mb-1.5">Real, unedited</p>
        <h1 className="font-display text-4xl tracking-wide text-ink">Community</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-dim">
          Everything below is a real comment from a real AniVerse member — nothing here is
          staged or made up.
        </p>
      </div>

      {recentComments.length === 0 ? (
        <div className="rounded-xl border border-line bg-panel px-6 py-12 text-center">
          <p className="text-sm text-ink-dim">
            No discussion yet — comments from any anime page will show up here as soon as
            people start posting.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentComments.map((c) => {
            const anime = animeMap.get(c.animeMalId);
            return (
              <div
                key={c.id}
                className="flex gap-4 rounded-xl border border-line bg-panel p-4"
              >
                {anime?.image && (
                  <Link href={`/anime/${c.animeMalId}`} className="shrink-0">
                    <div className="relative h-20 w-14 overflow-hidden rounded border border-line">
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
                    <span className="text-sm font-semibold text-ink">{c.user.name}</span>
                    <span className="text-xs text-ink-faint">commented on</span>
                    <Link
                      href={`/anime/${c.animeMalId}`}
                      className="text-sm text-cyan hover:underline"
                    >
                      {anime?.title ?? `#${c.animeMalId}`}
                    </Link>
                    <span className="font-mono text-[11px] text-ink-faint">
                      · {timeAgo(c.createdAt)}
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
