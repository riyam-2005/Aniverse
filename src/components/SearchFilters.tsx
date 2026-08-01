"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Genre } from "@/types/anime";

const TYPES = [
  { value: "", label: "Any type" },
  { value: "tv", label: "TV" },
  { value: "movie", label: "Movie" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
  { value: "special", label: "Special" },
  { value: "music", label: "Music" },
];

const STATUSES = [
  { value: "", label: "Any status" },
  { value: "airing", label: "Airing" },
  { value: "complete", label: "Completed" },
  { value: "upcoming", label: "Upcoming" },
];

const SORTS = [
  { value: "popularity-asc", label: "Most popular" },
  { value: "score-desc", label: "Highest rated" },
  { value: "start_date-desc", label: "Newest" },
  { value: "start_date-asc", label: "Oldest" },
  { value: "title-asc", label: "Title A–Z" },
];

const MIN_SCORES = [0, 6, 7, 7.5, 8, 8.5, 9];

/**
 * Every control here writes straight to the URL (via router.push) rather
 * than local state — that's what lets the results grid stay a plain
 * server component (SearchPage reads searchParams directly) and keeps
 * filtered searches bookmarkable/shareable, same pattern <Pagination />
 * already uses for page numbers.
 */
export default function SearchFilters({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams?.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Any filter change starts back at page 1 — staying on page 4 of a
    // now-different result set would just show a confusing mismatch.
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  }

  const selectedGenres = new Set(
    (searchParams?.get("genres") ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number)
  );

  function toggleGenre(id: number) {
    const next = new Set(selectedGenres);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update({ genres: next.size ? [...next].join(",") : null });
  }

  const currentSort = `${searchParams?.get("order_by") ?? "popularity"}-${
    searchParams?.get("sort") ?? "asc"
  }`;

  return (
    <div className="space-y-6 rounded-xl border border-line bg-panel p-5">
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          Sort by
        </label>
        <select
          value={currentSort}
          onChange={(e) => {
            const [orderBy, sort] = e.target.value.split("-");
            update({ order_by: orderBy, sort });
          }}
          className="input"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          Type
        </label>
        <select
          value={searchParams?.get("type") ?? ""}
          onChange={(e) => update({ type: e.target.value || null })}
          className="input"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          Status
        </label>
        <select
          value={searchParams?.get("status") ?? ""}
          onChange={(e) => update({ status: e.target.value || null })}
          className="input"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          Minimum score
        </label>
        <select
          value={searchParams?.get("min_score") ?? "0"}
          onChange={(e) => update({ min_score: e.target.value === "0" ? null : e.target.value })}
          className="input"
        >
          {MIN_SCORES.map((s) => (
            <option key={s} value={s}>
              {s === 0 ? "Any score" : `${s}+`}
            </option>
          ))}
        </select>
      </div>

      {genres.length > 0 && (
        <div>
          <label className="mb-2 block font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            Genres
          </label>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <button
                key={g.mal_id}
                type="button"
                onClick={() => toggleGenre(g.mal_id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  selectedGenres.has(g.mal_id)
                    ? "border-cyan bg-cyan/10 text-cyan"
                    : "border-line text-ink-dim hover:text-ink"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {(searchParams?.get("type") ||
        searchParams?.get("status") ||
        searchParams?.get("min_score") ||
        selectedGenres.size > 0) && (
        <button
          type="button"
          onClick={() =>
            update({ type: null, status: null, min_score: null, genres: null })
          }
          className="font-mono text-[11px] text-pink hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
