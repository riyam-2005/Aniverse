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

export default function SearchFilters({
  genres,
  onFilterApplied,
}: {
  genres: Genre[];
  onFilterApplied?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams?.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`/search?${params.toString()}`);
    onFilterApplied?.();
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
    const serialized = Array.from(next).join(",");
    update({ genres: serialized || null });
  }

  const currentType = searchParams?.get("type") ?? "";
  const currentStatus = searchParams?.get("status") ?? "";
  const currentSort = `${searchParams?.get("order_by") ?? "popularity"}-${
    searchParams?.get("sort") ?? "asc"
  }`;
  const currentMinScore = Number(searchParams?.get("min_score") ?? 0);

  const hasAnyFilter =
    !!currentType || !!currentStatus || !!searchParams?.get("order_by") || !!searchParams?.get("genres") || currentMinScore > 0;

  function clearAll() {
    router.push("/search");
    onFilterApplied?.();
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
          Filters
        </p>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="font-mono text-[11px] text-pink hover:underline"
          >
            Reset all
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="filter-type" className="mb-1.5 block font-mono text-[11px] text-ink-dim">
            Format
          </label>
          <select
            id="filter-type"
            value={currentType}
            onChange={(e) => update({ type: e.target.value || null })}
            className="input w-full py-1.5 text-xs bg-panel2 rounded-lg text-ink"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-status" className="mb-1.5 block font-mono text-[11px] text-ink-dim">
            Broadcast Status
          </label>
          <select
            id="filter-status"
            value={currentStatus}
            onChange={(e) => update({ status: e.target.value || null })}
            className="input w-full py-1.5 text-xs bg-panel2 rounded-lg text-ink"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-sort" className="mb-1.5 block font-mono text-[11px] text-ink-dim">
            Sort by
          </label>
          <select
            id="filter-sort"
            value={currentSort}
            onChange={(e) => {
              const [order_by, sort] = e.target.value.split("-");
              update({ order_by, sort });
            }}
            className="input w-full py-1.5 text-xs bg-panel2 rounded-lg text-ink"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 font-mono text-[11px] text-ink-dim">
            Minimum Rating: {currentMinScore > 0 ? `★ ${currentMinScore}+` : "Any"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MIN_SCORES.map((score) => {
              const active = currentMinScore === score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => update({ min_score: score === 0 ? null : String(score) })}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs transition-all ${
                    active
                      ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                      : "bg-panel2 text-ink-dim hover:text-ink"
                  }`}
                >
                  {score === 0 ? "Any" : `★ ${score}`}
                </button>
              );
            })}
          </div>
        </div>

        {genres.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[11px] text-ink-dim">Genres</p>
            <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
              {genres.map((g) => {
                const active = selectedGenres.has(g.mal_id);
                return (
                  <button
                    key={g.mal_id}
                    type="button"
                    onClick={() => toggleGenre(g.mal_id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                      active
                        ? "bg-cyan text-slate-950 font-bold shadow-sm"
                        : "bg-panel2 text-ink-dim hover:text-ink hover:bg-panel2/80"
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
