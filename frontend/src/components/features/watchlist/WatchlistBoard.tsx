"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import StarRating from "@/components/ui/StarRating";

export type LibraryStatus = "WATCHING" | "COMPLETED" | "PLAN_TO_WATCH" | "ON_HOLD" | "DROPPED";

export type LibraryItem = {
  id: string;
  mal_id: number;
  title: string;
  image_url: string | null;
  total_episodes: number | null;
  status: LibraryStatus;
  current_episode: number;
  score: number | null;
  is_favorite: boolean;
  rewatch_count?: number;
  updated_at?: string;
};

const STATUS_TABS: { key: LibraryStatus | "FAVORITES" | "ALL"; label: string }[] = [
  { key: "WATCHING", label: "Watching" },
  { key: "COMPLETED", label: "Completed" },
  { key: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { key: "ON_HOLD", label: "On Hold" },
  { key: "DROPPED", label: "Dropped" },
  { key: "FAVORITES", label: "Favorites" },
  { key: "ALL", label: "All Titles" },
];

export default function WatchlistBoard({ initialItems }: { initialItems: LibraryItem[] }) {
  const [items, setItems] = useState<LibraryItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<LibraryStatus | "FAVORITES" | "ALL">("WATCHING");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Compute counts for each tab
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      WATCHING: 0,
      COMPLETED: 0,
      PLAN_TO_WATCH: 0,
      ON_HOLD: 0,
      DROPPED: 0,
      FAVORITES: 0,
      ALL: items.length,
    };
    for (const item of items) {
      if (map[item.status] !== undefined) map[item.status]++;
      if (item.is_favorite) map.FAVORITES++;
    }
    return map;
  }, [items]);

  // Filter items by active tab and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "FAVORITES" && !item.is_favorite) return false;
      if (activeTab !== "ALL" && activeTab !== "FAVORITES" && item.status !== activeTab) return false;

      // Query filter
      if (searchQuery.trim()) {
        return item.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [items, activeTab, searchQuery]);

  async function updateItem(
    id: string,
    malId: number,
    patch: Partial<LibraryItem> & { increment_by?: number; action?: string }
  ) {
    setPendingId(id);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (patch.action === "rewatch") {
          return {
            ...i,
            rewatch_count: (i.rewatch_count || 0) + 1,
            status: "WATCHING",
            current_episode: 1,
          };
        }
        if (patch.increment_by !== undefined) {
          const nextEp = i.total_episodes
            ? Math.min(i.total_episodes, i.current_episode + patch.increment_by)
            : i.current_episode + patch.increment_by;
          const completed = Boolean(i.total_episodes && nextEp >= i.total_episodes);
          return {
            ...i,
            current_episode: nextEp,
            status: completed ? "COMPLETED" : i.status === "PLAN_TO_WATCH" ? "WATCHING" : i.status,
          };
        }
        return { ...i, ...patch };
      })
    );

    try {
      await fetch(`/api/watchlist/${malId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } finally {
      setPendingId(null);
    }
  }

  async function removeItem(id: string, malId: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/watchlist/${malId}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar: Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-panel rounded-2xl border border-line">
          {STATUS_TABS.map((tab) => {
            const count = counts[tab.key] ?? 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-cyan/15 text-cyan border border-cyan/40 shadow-sm"
                    : "text-ink-dim hover:text-ink hover:bg-panel2/60 border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                    isActive ? "bg-cyan/30 text-cyan" : "bg-panel2 text-ink-faint"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search within library */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your library..."
            className="w-full rounded-full border border-line bg-panel px-4 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-cyan focus:outline-none"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-20 text-center bg-panel/30">
          <p className="text-ink-dim text-sm">
            {searchQuery ? "No matching titles found." : "No anime in this category yet."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/trending" className="btn-primary inline-flex text-xs">
              Explore Trending
            </Link>
            <Link href="/ask" className="btn-secondary inline-flex text-xs">
              ✨ Ask AI Recommendations
            </Link>
          </div>
        </div>
      ) : (
        /* Library Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const progressRatio = item.total_episodes
              ? Math.min(100, Math.round((item.current_episode / item.total_episodes) * 100))
              : 0;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-line bg-panel p-4 hover:border-cyan/40 transition-all shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Poster */}
                  <Link
                    href={`/anime/${item.mal_id}`}
                    className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-panel2 border border-line/60 shadow"
                  >
                    {item.image_url && (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </Link>

                  {/* Info & Progress */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/anime/${item.mal_id}`}
                          className="line-clamp-1 font-semibold text-sm text-ink hover:text-cyan"
                        >
                          {item.title}
                        </Link>
                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item.id, item.mal_id, { is_favorite: !item.is_favorite })
                          }
                          className={`text-sm transition-transform hover:scale-125 ${
                            item.is_favorite ? "text-pink" : "text-ink-faint hover:text-pink"
                          }`}
                          title={item.is_favorite ? "Favorited" : "Mark favorite"}
                        >
                          {item.is_favorite ? "❤️" : "🤍"}
                        </button>
                      </div>

                      {/* Rewatch Badge if rewatched */}
                      {Boolean(item.rewatch_count && item.rewatch_count > 0) && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[10px] text-purple-300 border border-purple-500/30">
                            🔄 Rewatched {item.rewatch_count}x
                          </span>
                        </div>
                      )}

                      {/* Episode Counter & Progress Steppers */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-ink-dim">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateItem(item.id, item.mal_id, {
                                current_episode: Math.max(0, item.current_episode - 1),
                              })
                            }
                            className="flex h-6 w-6 items-center justify-center rounded border border-line bg-panel2 hover:border-cyan/50 text-ink"
                            aria-label="Decrease episode"
                          >
                            −
                          </button>
                          <span className="font-semibold text-ink px-1">
                            Ep {item.current_episode}
                            {item.total_episodes ? ` / ${item.total_episodes}` : ""}
                          </span>
                          <button
                            onClick={() =>
                              updateItem(item.id, item.mal_id, {
                                current_episode: item.total_episodes
                                  ? Math.min(item.total_episodes, item.current_episode + 1)
                                  : item.current_episode + 1,
                              })
                            }
                            className="flex h-6 w-6 items-center justify-center rounded border border-line bg-panel2 hover:border-cyan/50 text-ink"
                            aria-label="Increase episode"
                          >
                            +
                          </button>
                        </div>

                        {/* Batch Episode Increment Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Binge +3 episodes"
                            onClick={() => updateItem(item.id, item.mal_id, { increment_by: 3 })}
                            className="rounded border border-line bg-panel2 px-1.5 py-0.5 text-[10px] text-ink-dim hover:text-cyan hover:border-cyan/40"
                          >
                            +3
                          </button>
                          <button
                            type="button"
                            title="Binge +5 episodes"
                            onClick={() => updateItem(item.id, item.mal_id, { increment_by: 5 })}
                            className="rounded border border-line bg-panel2 px-1.5 py-0.5 text-[10px] text-ink-dim hover:text-cyan hover:border-cyan/40"
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {item.total_episodes && item.total_episodes > 0 && (
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-panel2">
                          <div
                            className="h-full bg-cyan transition-all duration-300"
                            style={{ width: `${progressRatio}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="mt-3">
                      <StarRating
                        score={item.score}
                        size="sm"
                        onChange={(score) => updateItem(item.id, item.mal_id, { score })}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Status Dropdown, Rewatch & Remove */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      disabled={pendingId === item.id}
                      onChange={(e) =>
                        updateItem(item.id, item.mal_id, {
                          status: e.target.value as LibraryStatus,
                        })
                      }
                      className="input !w-auto py-1 px-3 text-xs bg-panel2 border-line rounded-lg text-ink font-medium"
                    >
                      <option value="WATCHING">Watching</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="PLAN_TO_WATCH">Plan to Watch</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="DROPPED">Dropped</option>
                    </select>

                    {item.status === "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, item.mal_id, { action: "rewatch" })}
                        className="rounded-lg border border-line bg-panel2 px-2.5 py-1 text-xs text-ink-dim hover:text-cyan hover:border-cyan/50 transition-colors flex items-center gap-1 font-mono"
                        title="Start a rewatch of this completed anime"
                      >
                        <span>🔄</span> Rewatch
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/anime/${item.mal_id}`}
                      className="text-xs font-mono text-cyan hover:underline"
                    >
                      View Anime →
                    </Link>
                    <button
                      onClick={() => removeItem(item.id, item.mal_id)}
                      className="text-xs text-pink/80 hover:text-pink px-2 py-1"
                      aria-label="Remove anime from library"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
