"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BLUR_DATA_URL } from "@/lib/image";

export type ContinueItem = {
  id: string;
  malId: number;
  title: string;
  imageUrl: string;
  totalEpisodes: number | null;
  progress: number;
};

export default function ContinueWatchingCard({ item }: { item: ContinueItem }) {
  const [progress, setProgress] = useState(item.progress);
  const [saving, setSaving] = useState(false);

  const total = item.totalEpisodes;
  const pct = total ? Math.min(100, Math.round((progress / total) * 100)) : null;
  const finished = total != null && progress >= total;

  async function bumpEpisode(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saving || finished) return;

    const next = total ? Math.min(total, progress + 1) : progress + 1;
    const prev = progress;
    setSaving(true);
    setProgress(next);

    try {
      const res = await fetch(`/api/watchlist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProgress(prev);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Link
      href={`/anime/${item.malId}`}
      className="group block w-36 shrink-0 overflow-hidden rounded-lg border border-line bg-panel transition-colors hover:border-cyan/40 sm:w-44"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-panel2">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 40vw, 180px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
        {pct !== null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-void/60">
            <div className="h-full bg-pink" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <div className="p-2.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-cyan transition-colors">
          {item.title}
        </h3>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-ink-faint">
          <span>
            Ep {progress}
            {total ? ` / ${total}` : ""}
          </span>
          <button
            type="button"
            onClick={bumpEpisode}
            disabled={saving || finished}
            className="rounded border border-line px-1.5 py-0.5 text-ink-dim transition-colors hover:border-cyan/50 hover:text-cyan disabled:opacity-40"
          >
            {finished ? "Done" : saving ? "…" : "+1 ep"}
          </button>
        </div>
      </div>
    </Link>
  );
}
