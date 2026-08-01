import Image from "next/image";
import Link from "next/link";
import type { Anime } from "@/types/anime";
import { BLUR_DATA_URL } from "@/lib/image";

export default function AnimeCard({
  anime,
  priority = false,
}: {
  anime: Anime;
  /** Set true for cards in the first visible row so Next.js preloads the
   *  image and skips lazy-loading — improves LCP for the grid's hero
   *  content instead of treating every card, including off-screen ones,
   *  identically. */
  priority?: boolean;
}) {
  const title = anime.title_english || anime.title;
  const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;

  return (
    <Link
      href={`/anime/${anime.mal_id}`}
      className="group block overflow-hidden rounded-lg border border-line bg-panel transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:shadow-lg hover:shadow-black/20 active:scale-[0.98] active:duration-100"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-panel2">
        {img && (
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
        {typeof anime.score === "number" && (
          <span className="absolute right-1.5 top-1.5 rounded bg-void/80 px-1.5 py-0.5 font-mono text-[11px] text-amber backdrop-blur-sm">
            {anime.score.toFixed(1)}
          </span>
        )}
        {anime.airing && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-void/80 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-pink backdrop-blur-sm">
            <span className="on-air-dot" /> airing
          </span>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-cyan transition-colors">
          {title}
        </h3>
        <p className="mt-1 font-mono text-[11px] text-ink-faint">
          {anime.episodes ? `${anime.episodes} eps` : "— eps"}
          {anime.year ? ` · ${anime.year}` : ""}
        </p>
      </div>
    </Link>
  );
}
