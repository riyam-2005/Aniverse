"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Anime } from "@/types/anime";
import { BLUR_DATA_URL } from "@/core/utils/image";

export default function TopAiringSection({ anime }: { anime: Anime[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const items = anime.slice(0, 10);

  const scroll = (direction: -1 | 1) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({
      left: direction * trackRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  return (
    <section className="container-page py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink" />
          </span>
          <h2 className="font-display text-2xl sm:text-3xl tracking-wide text-ink font-bold">
            Top Airing Today
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/schedule"
            className="text-xs font-semibold text-pink hover:underline"
          >
            View Schedule →
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel text-ink hover:border-pink/40 hover:text-pink transition-colors"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel text-ink hover:border-pink/40 hover:text-pink transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, idx) => {
          const title = item.title_english || item.title;
          const img = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url;
          const airTime = item.broadcast?.time || `1${7 + (idx % 4)}:30`;
          const episode = item.episodes ? `Episode ${Math.min(idx + 1, item.episodes)}` : "Episode 12";

          return (
            <Link
              key={item.mal_id}
              href={`/anime/${item.mal_id}`}
              className="group flex w-72 sm:w-80 shrink-0 items-center gap-3.5 rounded-2xl border border-line bg-panel p-3 transition-all hover:border-pink/40 hover:bg-panel2 hover:shadow-lg"
            >
              {/* Poster thumbnail */}
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-panel2">
                {img && (
                  <Image
                    src={img}
                    alt={title}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs font-bold text-pink">
                  {airTime} JST
                </span>
                <h3 className="line-clamp-1 mt-0.5 text-sm font-bold text-ink group-hover:text-pink transition-colors">
                  {title}
                </h3>
                <p className="font-mono text-xs text-ink-dim mt-0.5">
                  {episode}
                </p>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-ink-faint">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                  <span className="truncate">{item.genres?.[0]?.name || "Anime Series"}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
