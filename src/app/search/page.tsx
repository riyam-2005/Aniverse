import type { Metadata } from "next";
import { searchAnime, getGenres } from "@/lib/jikan";
import AnimeCard from "@/components/AnimeCard";
import FetchFailedNotice from "@/components/FetchFailedNotice";
import Pagination from "@/components/Pagination";
import SearchFilters from "@/components/SearchFilters";

interface SearchPageParams {
  q?: string;
  page?: string;
  type?: string;
  status?: string;
  min_score?: string;
  genres?: string;
  order_by?: string;
  sort?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchPageParams;
}): Promise<Metadata> {
  const q = searchParams.q?.trim();
  return {
    title: q ? `"${q}" search results — AniVerse` : "Search — AniVerse",
    // Search result pages are low-value, near-duplicate content for
    // crawlers — keep them out of the index, but still perfectly linkable.
    robots: { index: false },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchPageParams;
}) {
  const q = searchParams.q?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.page) || 1);

  const filters = {
    type: searchParams.type,
    status: searchParams.status,
    minScore: searchParams.min_score ? Number(searchParams.min_score) : undefined,
    genres: searchParams.genres
      ? searchParams.genres.split(",").filter(Boolean).map(Number)
      : undefined,
    orderBy: searchParams.order_by,
    sort: searchParams.sort as "asc" | "desc" | undefined,
  };

  // A filter-only browse (no typed query) is just as valid as a text
  // search — only skip the fetch when there's truly nothing to search by.
  const hasActiveSearch =
    !!q || !!filters.type || !!filters.status || !!filters.minScore || !!filters.genres?.length;

  const [raw, genresRaw] = await Promise.all([
    hasActiveSearch
      ? searchAnime(q, page, filters).catch(() => null)
      : Promise.resolve<Awaited<ReturnType<typeof searchAnime>> | null>({ data: [] }),
    getGenres().catch(() => []),
  ]);
  const failed = hasActiveSearch ? raw === null : false;
  const result = raw ?? { data: [] };

  // Preserved across pagination links and passed back into the filter
  // panel's initial state via the URL — this is the full set of params
  // that define "what search is this," not just the text query.
  const preservedParams = {
    q: q || undefined,
    type: filters.type,
    status: filters.status,
    min_score: searchParams.min_score,
    genres: searchParams.genres,
    order_by: searchParams.order_by,
    sort: searchParams.sort,
  };

  return (
    <div className="container-page py-10">
      <p className="eyebrow mb-1.5">Search results</p>
      <h1 className="font-display text-4xl tracking-wide text-ink">
        {q ? `"${q}"` : "Search AniVerse"}
      </h1>

      {hasActiveSearch && !failed && (
        <p className="mt-2 text-sm text-ink-dim">
          {result.data.length} result{result.data.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <SearchFilters genres={genresRaw ?? []} />
        </aside>

        <div>
          <div className="stagger-fade grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {failed && (
              <FetchFailedNotice message="Couldn't run that search — the anime data source may be temporarily unavailable." />
            )}
            {hasActiveSearch && !failed && result.data.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-ink-faint">
                No titles matched — try different filters.
              </p>
            )}
            {!hasActiveSearch && (
              <p className="col-span-full py-12 text-center text-sm text-ink-faint">
                Type a search or pick some filters to get started.
              </p>
            )}
            {result.data.map((a) => (
              <AnimeCard key={a.mal_id} anime={a} />
            ))}
          </div>

          {hasActiveSearch && !failed && (
            <Pagination
              currentPage={page}
              hasNextPage={raw?.pagination?.has_next_page ?? false}
              basePath="/search"
              searchParams={preservedParams}
            />
          )}
        </div>
      </div>
    </div>
  );
}
