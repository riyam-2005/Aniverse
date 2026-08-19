"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import StarRating from "./StarRating";

export type Item = {
  id: string;
  malId: number;
  title: string;
  imageUrl: string;
  totalEpisodes: number | null;
  status: "PLANNING" | "WATCHING" | "COMPLETED" | "ON_HOLD" | "DROPPED";
  progress: number;
  score: number | null;
};

const STATUS_LABELS: Record<Item["status"], string> = {
  WATCHING: "Watching",
  PLANNING: "Plan to Watch",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  DROPPED: "Dropped",
};

const STATUS_ORDER: Item["status"][] = [
  "WATCHING",
  "PLANNING",
  "COMPLETED",
  "ON_HOLD",
  "DROPPED",
];

export default function WatchlistBoard({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [pending, setPending] = useState<string | null>(null);

  async function updateItem(id: string, patch: Partial<Item>) {
    setPending(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    try {
      await fetch(`/api/watchlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } finally {
      setPending(null);
    }
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line py-20 text-center">
        <p className="text-ink-dim">Your list is empty.</p>
        <Link href="/trending" className="btn-primary mt-4 inline-flex">
          Browse trending anime
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {STATUS_ORDER.map((status) => {
        const group = items.filter((i) => i.status === status);
        if (group.length === 0) return null;

        return (
          <div key={status}>
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
              {STATUS_LABELS[status]} · {group.length}
            </h2>
            <div className="space-y-3">
              {group.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-3 sm:flex-row sm:items-center"
                >
                  <Link
                    href={`/anime/${item.malId}`}
                    className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-panel2"
                  >
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 64px, 96px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/anime/${item.malId}`}
                      className="line-clamp-1 text-sm font-semibold text-ink hover:text-cyan"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 font-mono text-xs text-ink-faint">
                      <button
                        onClick={() =>
                          updateItem(item.id, {
                            progress: Math.max(0, item.progress - 1),
                          })
                        }
                        className="rounded border border-line px-1.5 hover:border-cyan/50"
                        aria-label="Decrease progress"
                      >
                        −
                      </button>
                      <span>
                        {item.progress}
                        {item.totalEpisodes ? ` / ${item.totalEpisodes}` : ""} eps
                      </span>
                      <button
                        onClick={() =>
                          updateItem(item.id, {
                            progress: item.totalEpisodes
                              ? Math.min(item.totalEpisodes, item.progress + 1)
                              : item.progress + 1,
                          })
                        }
                        className="rounded border border-line px-1.5 hover:border-cyan/50"
                        aria-label="Increase progress"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <StarRating
                      score={item.score}
                      size="sm"
                      onChange={(score) => updateItem(item.id, { score })}
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={item.status}
                      disabled={pending === item.id}
                      onChange={(e) =>
                        updateItem(item.id, { status: e.target.value as Item["status"] })
                      }
                      className="input !w-auto py-1.5 text-xs"
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="btn-ghost px-2 text-pink"
                      aria-label="Remove from list"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
