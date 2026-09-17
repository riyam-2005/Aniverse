"use client";

import Image from "next/image";
import Link from "next/link";
import type { Anime } from "@/types/anime";
import { BLUR_DATA_URL } from "@/core/utils/image";

interface RankingCarouselsProps {
  popularAnime: Anime[];
  favouriteAnime: Anime[];
}

export default function RankingCarousels({
  popularAnime,
  favouriteAnime,
}: RankingCarouselsProps) {
  const popularList = popularAnime.slice(0, 5);
  const favouriteList = favouriteAnime.slice(0, 5);

  const renderRankingCard = (anime: Anime, rank: number) => {
    const title = anime.title_english || anime.title;
    const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
    const score = anime.score ? anime.score.toFixed(1) : "8.8";
    const episodes = anime.episodes || 24;

    return (
      <Link
        key={anime.mal_id}
        href={`/anime/${anime.mal_id}`}
        className="group relative flex w-36 sm:w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-all hover:-translate-y-1 hover:border-pink/40 hover:shadow-xl"
      >
        {/* Poster */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-panel2">
          {img && (
            <Image
              src={img}
              alt={title}
              fill
              sizes="(max-width: 640px) 140px, 160px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          )}

          {/* Ranking Badge top-left */}
          <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-black/80 font-mono text-xs font-black text-white backdrop-blur-md border border-white/20">
            {rank}
          </span>

          {/* Score bottom-left */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-amber font-bold backdrop-blur-md">
            <span>★</span>
            <span>{score}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between p-2.5">
          <h4 className="line-clamp-2 text-xs font-bold text-ink group-hover:text-pink transition-colors">
            {title}
          </h4>

          {/* CC / Sub episode count pill */}
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px]">
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400 font-semibold">
              CC {episodes}
            </span>
            <span className="rounded bg-cyan/20 px-1.5 py-0.5 text-cyan font-semibold">
              HD
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className="container-page py-6">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* Most Popular Column */}
        <div className="rounded-3xl border border-line bg-panel/60 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h3 className="font-display text-2xl tracking-wide text-ink font-bold">
                Most Popular
              </h3>
            </div>
            <Link
              href="/trending"
              className="text-xs font-semibold text-pink hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {popularList.map((anime, i) => renderRankingCard(anime, i + 1))}
          </div>
        </div>

        {/* Most Favourite Column */}
        <div className="rounded-3xl border border-line bg-panel/60 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💖</span>
              <h3 className="font-display text-2xl tracking-wide text-ink font-bold">
                Most Favourite
              </h3>
            </div>
            <Link
              href="/discover"
              className="text-xs font-semibold text-pink hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {favouriteList.map((anime, i) => renderRankingCard(anime, i + 1))}
          </div>
        </div>
      </div>
    </section>
  );
}
