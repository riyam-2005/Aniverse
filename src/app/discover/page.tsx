import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTopAnime, getSeasonNow, getUpcoming, getGenres } from "@/core/clients/jikan";
import AnimeGrid from "@/components/features/home/AnimeGrid";
import SearchBar from "@/components/features/search/SearchBar";

export const metadata: Metadata = {
  title: "Discover Anime — AniVerse",
  description: "Explore top-rated anime, upcoming seasons, and trending titles curated for you.",
};

export const revalidate = 3600;

export default async function DiscoverPage() {
  const [top, season, upcoming, genres] = await Promise.all([
    getTopAnime(1).catch(() => ({ data: [] })),
    getSeasonNow(1).catch(() => ({ data: [] })),
    getUpcoming(1).catch(() => ({ data: [] })),
    getGenres().catch(() => []),
  ]);

  return (
    <div className="container-page py-10 space-y-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-r from-panel2 via-void to-panel p-8 sm:p-12 shadow-xl">
        <div className="max-w-2xl">
          <p className="eyebrow mb-2">Curated Exploration</p>
          <h1 className="font-display text-4xl sm:text-6xl tracking-wide text-ink">
            Discover Your Next <span className="text-pink">Masterpiece</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-ink-dim leading-relaxed">
            Browse through seasonal charts, explore top-tier anime across every genre, or ask our AI companion for grounded suggestions tailored to your taste.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-72">
              <Suspense fallback={<div className="h-10 w-full rounded-full bg-panel2" />}>
                <SearchBar />
              </Suspense>
            </div>
            <Link
              href="/ask"
              className="shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-pink to-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-pink/25 hover:shadow-lg hover:shadow-pink/35 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-sm">✨</span>
              <span>Ask Aniverse AI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Genre Pills */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-ink">Popular Genres</h2>
          <Link href="/genres" className="text-xs font-mono text-cyan hover:underline">
            All genres →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {genres.slice(0, 14).map((g) => (
            <Link
              key={g.mal_id}
              href={`/search?genre=${g.mal_id}`}
              className="rounded-full border border-line bg-panel px-4 py-1.5 text-xs text-ink-dim hover:border-cyan hover:text-cyan hover:bg-panel2 transition-all"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Airing Season */}
      <AnimeGrid
        title="Popular This Season"
        eyebrow="Currently broadcasting"
        anime={season.data}
        viewAllHref="/schedule"
      />

      {/* Top Anime */}
      <AnimeGrid
        title="All-Time Masterpieces"
        eyebrow="Highest rated by community"
        anime={top.data}
        viewAllHref="/trending"
      />

      {/* Upcoming Anticipated */}
      <AnimeGrid
        title="Highly Anticipated Upcoming"
        eyebrow="Releasing next season"
        anime={upcoming.data}
      />
    </div>
  );
}
