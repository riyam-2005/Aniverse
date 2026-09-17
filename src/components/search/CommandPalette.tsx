"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { searchAnime } from "@/core/clients/jikan";
import type { Anime } from "@/types/anime";
import { BLUR_DATA_URL } from "@/core/utils/image";

const TRENDING_SUGGESTIONS = [
  "Attack on Titan",
  "Solo Leveling",
  "Demon Slayer",
  "Jujutsu Kaisen",
  "One Piece",
  "Chainsaw Man",
  "Death Note",
];

const RECENT_SEARCHES_KEY = "aniverse:recent_searches";

export default function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // Non-fatal
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Live search debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchAnime(query.trim(), 1);
        setResults(res.data.slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const saveRecent = useCallback((term: string) => {
    try {
      const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Non-fatal
    }
  }, [recentSearches]);

  const handleSelect = (anime: Anime) => {
    saveRecent(anime.title_english || anime.title);
    onClose();
    router.push(`/anime/${anime.mal_id}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveRecent(query.trim());
    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleSelect]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-[12vh] backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/60 transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-line px-4 py-3.5">
          <svg className="h-5 w-5 text-pink shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search anime, character, studio..."
            className="w-full bg-transparent px-3 text-base text-ink placeholder-ink-faint focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mr-2 text-xs text-ink-faint hover:text-ink"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-line bg-panel2 px-2 py-0.5 font-mono text-[10px] text-ink-dim">
            ESC
          </kbd>
        </form>

        {/* Content body */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-pink border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1.5">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                Results ({results.length})
              </p>
              {results.map((anime, i) => {
                const title = anime.title_english || anime.title;
                const isSelected = i === selectedIndex;
                return (
                  <div
                    key={anime.mal_id}
                    onClick={() => handleSelect(anime)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-all ${
                      isSelected
                        ? "bg-pink/15 border border-pink/30 text-white shadow-sm"
                        : "hover:bg-panel2 text-ink-dim"
                    }`}
                  >
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md border border-line bg-panel2">
                      {anime.images?.jpg?.image_url && (
                        <Image
                          src={anime.images.jpg.image_url}
                          alt={title}
                          fill
                          sizes="40px"
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {title}
                      </p>
                      <p className="font-mono text-xs text-ink-faint">
                        {anime.type || "TV"} · {anime.episodes ? `${anime.episodes} eps` : "Airing"} · {anime.year || "—"}
                      </p>
                    </div>
                    {anime.score && (
                      <span className="shrink-0 font-mono text-xs font-bold text-amber">
                        ★ {anime.score.toFixed(1)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !query && (
            <div className="space-y-6">
              {recentSearches.length > 0 && (
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                      Recent Searches
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem(RECENT_SEARCHES_KEY);
                      }}
                      className="font-mono text-[10px] text-ink-faint hover:text-pink transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="rounded-full border border-line bg-panel2 px-3 py-1 text-xs text-ink-dim hover:border-cyan/50 hover:text-cyan transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-pink font-semibold">
                  <span>🔥</span> Trending Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SUGGESTIONS.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="rounded-full border border-line bg-panel2 px-3.5 py-1.5 text-xs text-ink-dim hover:border-pink hover:text-pink hover:bg-pink/10 transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-ink-dim">No anime found for &quot;{query}&quot;</p>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="btn-primary mt-3 text-xs"
              >
                Search Full Catalog ↗
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
