"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Genre } from "@/types/anime";

function formatCount(count?: number) {
  if (!count) return null;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

function GenrePill({ genre, active }: { genre: Genre; active: boolean }) {
  const count = formatCount(genre.count);
  return (
    <Link
      href={`/genres?id=${genre.mal_id}`}
      className={`group inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? "border-cyan bg-cyan/10 text-cyan"
          : "border-line text-ink-dim hover:border-ink-faint hover:text-ink"
      }`}
    >
      {genre.name}
      {count && (
        <span
          className={`font-mono text-[10px] ${
            active ? "text-cyan/70" : "text-ink-faint group-hover:text-ink-dim"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

/**
 * Searchable genre grid for /genres. Featured genres show up front as a
 * quick-pick row; everything else (60+ genres/themes/demographics on MAL)
 * is filterable by name instead of hidden behind a single <details> toggle,
 * which was hard to scan once expanded.
 */
export default function GenreExplorer({
  featured,
  otherGenres,
  selectedId,
}: {
  featured: Genre[];
  otherGenres: Genre[];
  selectedId?: number;
}) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  const filteredOthers = useMemo(() => {
    if (!isSearching) return otherGenres;
    return otherGenres.filter((g) => g.name.toLowerCase().includes(trimmed));
  }, [otherGenres, trimmed, isSearching]);

  const filteredFeatured = useMemo(() => {
    if (!isSearching) return featured;
    return featured.filter((g) => g.name.toLowerCase().includes(trimmed));
  }, [featured, trimmed, isSearching]);

  const nothingFound = isSearching && filteredFeatured.length === 0 && filteredOthers.length === 0;

  return (
    <div>
      <div className="relative max-w-xs">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a genre…"
          aria-label="Filter genres by name"
          className="input-pill py-2 pl-9 text-sm"
        />
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
      </div>

      {!isSearching && filteredFeatured.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {filteredFeatured.map((g) => (
            <GenrePill key={g.mal_id} genre={g} active={selectedId === g.mal_id} />
          ))}
        </div>
      )}

      {isSearching && (
        <div className="mt-5 flex flex-wrap gap-2">
          {[...filteredFeatured, ...filteredOthers].map((g) => (
            <GenrePill key={g.mal_id} genre={g} active={selectedId === g.mal_id} />
          ))}
        </div>
      )}

      {nothingFound && (
        <p className="mt-5 text-sm text-ink-faint">No genres match “{query}”.</p>
      )}

      {!isSearching && filteredOthers.length > 0 && (
        <details className="group mt-4">
          <summary className="cursor-pointer text-sm text-ink-dim transition-colors hover:text-ink">
            Show all {featured.length + otherGenres.length} genres
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {filteredOthers.map((g) => (
              <GenrePill key={g.mal_id} genre={g} active={selectedId === g.mal_id} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
