import Link from "next/link";
import { safeJsonLdString } from "@/lib/json-ld";
import type { Metadata } from "next";
import { getSeasonNow, getTopAiring, getTopAnime, getUpcoming } from "@/lib/jikan";
import type { Anime, JikanListResponse } from "@/types/anime";
import AnimeCard from "@/components/AnimeCard";
import FetchFailedNotice from "@/components/FetchFailedNotice";
import OfflinePicksNotice from "@/components/OfflinePicksNotice";
import { FALLBACK_ANIME } from "@/lib/fallback-anime";
import Pagination from "@/components/Pagination";
import TrendingStats from "@/components/TrendingStats";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Trending Anime — AniVerse",
  description:
    "See what's trending right now: the most popular airing titles, all-time top rated anime, this season's lineup, and what's coming up next.",
  openGraph: {
    title: "Trending Anime — AniVerse",
    description: "The most popular airing titles, top rated anime, this season's lineup, and what's coming up next.",
    type: "website",
  },
};

const TABS = [
  { key: "airing", label: "Trending" },
  { key: "top", label: "Top Rated" },
  { key: "season", label: "This Season" },
  { key: "upcoming", label: "Upcoming" },
];

export default async function TrendingPage({
  searchParams,
}: {
  searchParams?: { tab?: string; page?: string };
}) {
  const tab = searchParams?.tab && TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab : "airing";
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const fetchers: Record<string, (page: number) => Promise<JikanListResponse<Anime>>> = {
    airing: getTopAiring,
    top: getTopAnime,
    season: getSeasonNow,
    upcoming: getUpcoming,
  };

  const raw = await fetchers[tab](page).catch(() => null);
  const failed = raw === null;
  const showFallback = failed && page === 1;
  const result = raw ?? { data: showFallback ? FALLBACK_ANIME : [] };

  const itemListJsonLd = !failed && result.data.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${TABS.find((t) => t.key === tab)?.label ?? "Trending"} Anime`,
    itemListElement: result.data.slice(0, 20).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/anime/${a.mal_id}`,
      name: a.title_english || a.title,
    })),
  } : null;

  return (
    <div className="container-page py-10">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdString(itemListJsonLd) }}
        />
      )}
      <p className="eyebrow mb-1.5">Rankings</p>
      <h1 className="font-display text-5xl tracking-wide text-ink">Trending</h1>

      <div className="mt-6 flex gap-2 border-b border-line pb-px">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/trending?tab=${t.key}`}
            className={`rounded-t-md px-4 py-2 text-sm transition-colors ${
              tab === t.key
                ? "border-b-2 border-cyan text-ink"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {!failed && (
        <div className="mt-8">
          <TrendingStats items={result.data} />
        </div>
      )}

      <div className="stagger-fade mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {failed && showFallback && <OfflinePicksNotice />}
        {failed && !showFallback && <FetchFailedNotice />}
        {result.data.map((a, i) => (
          <AnimeCard key={a.mal_id} anime={a} priority={i < 6} />
        ))}
      </div>

      {!failed && (
        <Pagination
          currentPage={page}
          hasNextPage={raw?.pagination?.has_next_page ?? false}
          basePath="/trending"
          searchParams={{ tab }}
        />
      )}
    </div>
  );
}
