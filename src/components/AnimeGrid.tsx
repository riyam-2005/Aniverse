import Link from "next/link";
import type { Anime } from "@/types/anime";
import AnimeCard from "./AnimeCard";

export default function AnimeGrid({
  title,
  eyebrow,
  anime,
  viewAllHref,
}: {
  title: string;
  eyebrow?: string;
  anime: Anime[];
  viewAllHref?: string;
}) {
  if (!anime.length) return null;

  return (
    <section className="container-page py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h2 className="font-display text-3xl tracking-wide text-ink">{title}</h2>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="font-mono text-xs uppercase tracking-wider text-cyan hover:text-ink transition-colors"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="stagger-fade grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {anime.map((a) => (
          <AnimeCard key={a.mal_id} anime={a} />
        ))}
      </div>
    </section>
  );
}
