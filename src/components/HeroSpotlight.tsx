"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Anime } from "@/types/anime";

const AUTOPLAY_MS = 6500;

export default function HeroSpotlight({ items }: { items: Anime[] }) {
  const slides = items.slice(0, 7).filter((a) => a.images?.jpg?.large_image_url || a.images?.jpg?.image_url);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (next: number) => {
      const total = slides.length;
      setIndex(((next % total) + total) % total);
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="group/hero relative overflow-hidden border-b border-line"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backdrop stack — crossfades between slides */}
      <div className="absolute inset-0">
        {slides.map((anime, i) => {
          const bg = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
          return (
            <div
              key={anime.mal_id}
              className="absolute inset-0 transition-opacity duration-1000 ease-out"
              style={{ opacity: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              {bg && (
                <Image
                  src={bg}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover opacity-30"
                />
              )}
            </div>
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/85 to-void/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/70 via-void/10 to-transparent" />
        <div className="bg-grain absolute inset-0" />
      </div>

      {/* Slide content */}
      <div className="container-page relative py-16 sm:py-24 lg:py-28">
        {slides.map((anime, i) => {
          if (i !== index) return null;
          const title = anime.title_english || anime.title;
          const synopsis = anime.synopsis
            ? anime.synopsis.length > 220
              ? anime.synopsis.slice(0, 220).trim() + "…"
              : anime.synopsis
            : null;

          return (
            <div key={anime.mal_id} className="max-w-2xl animate-splash-in">
              <p className="eyebrow mb-4 flex items-center gap-2 text-pink">
                <span className="on-air-dot" />
                #{i + 1} Spotlight
              </p>
              <h1 className="font-display text-4xl leading-[0.98] tracking-wide text-ink sm:text-5xl lg:text-6xl">
                {title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-ink-dim">
                {anime.status && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-cyan">▶</span> TV
                  </span>
                )}
                {anime.duration && <span>{anime.duration}</span>}
                {typeof anime.score === "number" && (
                  <span className="flex items-center gap-1 text-amber">
                    👍 {Math.round(anime.score * 10)}%
                  </span>
                )}
              </div>

              {!!anime.genres?.length && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {anime.genres.slice(0, 4).map((g) => (
                    <span
                      key={g.mal_id}
                      className="rounded-full border border-line bg-void/40 px-3 py-1 text-xs text-ink-dim backdrop-blur-sm"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {synopsis && (
                <p className="mt-5 hidden text-sm leading-relaxed text-ink-dim sm:block">
                  {synopsis}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={`/anime/${anime.mal_id}`} className="btn-primary">
                  ▶ Watch Now
                </Link>
                <Link href={`/anime/${anime.mal_id}`} className="btn-secondary">
                  Detail ›
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Left / right arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous spotlight"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-line bg-void/70 p-2.5 text-ink opacity-0 backdrop-blur-sm transition-all hover:border-pink/50 hover:text-pink group-hover/hero:opacity-100 sm:flex sm:left-4"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label="Next spotlight"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-line bg-void/70 p-2.5 text-ink opacity-0 backdrop-blur-sm transition-all hover:border-pink/50 hover:text-pink group-hover/hero:opacity-100 sm:flex sm:right-4"
          >
            <ArrowIcon direction="right" />
          </button>
        </>
      )}

      {/* Dot indicators + slide counter */}
      {slides.length > 1 && (
        <div className="container-page relative flex items-center gap-4 pb-6 sm:pb-8">
          <div className="flex items-center gap-2">
            {slides.map((anime, i) => (
              <button
                key={anime.mal_id}
                type="button"
                aria-label={`Go to spotlight ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className="group/dot relative h-1.5 rounded-full bg-ink-faint/40 transition-all duration-300"
                style={{ width: i === index ? "28px" : "8px" }}
              >
                <span
                  className={`absolute inset-0 rounded-full bg-pink transition-opacity duration-300 ${
                    i === index ? "opacity-100" : "opacity-0 group-hover/dot:opacity-60"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="font-mono text-[11px] text-ink-faint">
            {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
        </div>
      )}
    </section>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={direction === "right" ? "" : "rotate-180"}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
