import Link from "next/link";
import { safeJsonLdString } from "@/lib/json-ld";
import type { Metadata } from "next";
import { getAnimeByGenre, getGenres } from "@/lib/jikan";
import AnimeCard from "@/components/AnimeCard";
import FetchFailedNotice from "@/components/FetchFailedNotice";
import OfflinePicksNotice from "@/components/OfflinePicksNotice";
import { FALLBACK_ANIME } from "@/lib/fallback-anime";
import Pagination from "@/components/Pagination";
import GenreExplorer from "@/components/GenreExplorer";

export const revalidate = 86400;
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Browse Anime by Genre — AniVerse",
  description:
    "Explore anime by genre — action, romance, fantasy, psychological, and more — powered by MyAnimeList data.",
  openGraph: {
    title: "Browse Anime by Genre — AniVerse",
    description: "Explore anime by genre — action, romance, fantasy, psychological, and more.",
    type: "website",
  },
};

const FEATURED_GENRE_IDS = [1, 2, 4, 8, 10, 22, 24, 27, 30, 36, 37, 41];

export default async function GenresPage({
  searchParams,
}: {
  searchParams?: { id?: string; page?: string };
}) {
  const genresRaw = await getGenres().catch(() => null);
  const genresFailed = genresRaw === null;
  const genres = genresRaw ?? [];
  const featured = genres.filter((g) => FEATURED_GENRE_IDS.includes(g.mal_id));
  const featuredIds = new Set(featured.map((g) => g.mal_id));
  const otherGenres = genres.filter((g) => !featuredIds.has(g.mal_id));

  const selectedId = searchParams?.id
    ? Number(searchParams.id)
    : (featured[0] ?? genres[0])?.mal_id;
  const selected = genres.find((g) => g.mal_id === selectedId);
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const animeRaw = selectedId
    ? await getAnimeByGenre(selectedId, page).catch(() => null)
    : { data: [] };
  const animeFailed = selectedId ? animeRaw === null : false;
  const showFallback = animeFailed && page === 1;
  const result = animeRaw ?? { data: showFallback ? FALLBACK_ANIME : [] };

  const itemListJsonLd = selected && !animeFailed && result.data.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${selected.name} Anime`,
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
      <p className="eyebrow mb-1.5">Browse</p>
      <h1 className="font-display text-5xl tracking-wide text-ink">Genres</h1>

      {genresFailed && (
        <div className="mt-6">
          <FetchFailedNotice message="Couldn't load the genre list — the anime data source may be temporarily unavailable." />
        </div>
      )}

      <div className="mt-6">
        <GenreExplorer
          featured={featured.length ? featured : genres}
          otherGenres={featured.length ? otherGenres : []}
          selectedId={selectedId}
        />
      </div>

      {selected && (
        <h2 className="mt-10 font-display text-2xl tracking-wide text-ink-dim">
          {selected.name}
        </h2>
      )}

      <div className="stagger-fade mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {animeFailed && showFallback && <OfflinePicksNotice />}
        {animeFailed && !showFallback && (
          <FetchFailedNotice message="Couldn't load titles for this genre — the anime data source may be temporarily unavailable." />
        )}
        {result.data.map((a, i) => (
          <AnimeCard key={a.mal_id} anime={a} priority={i < 6} />
        ))}
      </div>

      {selectedId && !animeFailed && (
        <Pagination
          currentPage={page}
          hasNextPage={animeRaw?.pagination?.has_next_page ?? false}
          basePath="/genres"
          searchParams={{ id: String(selectedId) }}
        />
      )}
    </div>
  );
}
