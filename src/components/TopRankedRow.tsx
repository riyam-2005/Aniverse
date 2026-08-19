"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { BLUR_DATA_URL } from "@/lib/image";
import type { Anime } from "@/types/anime";

export default function TopRankedRow({
  title,
  eyebrow,
  anime,
}: {
  title: string;
  eyebrow?: string;
  anime: Anime[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!anime.length) return null;

  function scrollBy(amount: number) {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="container-page py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h2 className="font-display text-3xl tracking-wide text-ink">{title}</h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-480)}
            aria-label="Scroll left"
            className="rounded-full border border-line px-3 py-1.5 text-ink-dim transition-colors hover:border-cyan/50 hover:text-cyan"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollBy(480)}
            aria-label="Scroll right"
            className="rounded-full border border-line px-3 py-1.5 text-ink-dim transition-colors hover:border-cyan/50 hover:text-cyan"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="stagger-fade flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {anime.slice(0, 10).map((a, i) => {
          const rank = i + 1;
          const animeTitle = a.title_english || a.title;
          const img = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url;

          return (
            <Link
              key={a.mal_id}
              href={`/anime/${a.mal_id}`}
              className="group flex shrink-0 items-end"
            >
              {/* Oversized rank number sitting behind/beside the poster */}
              <span
                aria-hidden
                className="font-display select-none pr-1 text-[96px] leading-[0.75] tracking-tighter text-transparent transition-colors group-hover:[-webkit-text-stroke-color:rgb(var(--c-cyan))]"
                style={{
                  WebkitTextStroke: "2px rgb(var(--c-ink-faint))",
                }}
              >
                {String(rank).padStart(2, "0")}
              </span>

              <div className="relative aspect-[2/3] w-[140px] shrink-0 overflow-hidden rounded-lg border border-line bg-panel2 transition-colors group-hover:border-cyan/50">
                {img && (
                  <Image
                    src={img}
                    alt={animeTitle}
                    fill
                    sizes="140px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                )}
                {typeof a.score === "number" && (
                  <span className="absolute right-1.5 top-1.5 rounded bg-void/80 px-1.5 py-0.5 font-mono text-[11px] text-amber backdrop-blur-sm">
                    {a.score.toFixed(1)}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/95 to-transparent p-2 pt-6">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-ink group-hover:text-cyan transition-colors">
                    {animeTitle}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
