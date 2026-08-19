import Image from "next/image";
import { safeJsonLdString } from "@/lib/json-ld";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAnimeById } from "@/lib/jikan";
import { STREAMING_PLATFORMS } from "@/types/anime";
import dynamic from "next/dynamic";
import WatchlistButton from "@/components/WatchlistButton";
import { CommentListSkeleton } from "@/components/Skeleton";

// Reviews and comments are well below the fold and both are "use client"
// components with their own form state/validation — code-splitting them
// keeps that JS out of the chunk needed for the initial render (synopsis,
// poster, streaming links), which is what actually needs to be fast here.
const ReviewSection = dynamic(() => import("@/components/ReviewSection"), {
  loading: () => <CommentListSkeleton count={2} />,
});
const CommentSection = dynamic(() => import("@/components/CommentSection"), {
  loading: () => <CommentListSkeleton count={3} />,
});

export const revalidate = 3600;

function platformColor(name: string) {
  const match = STREAMING_PLATFORMS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
  return match?.color ?? "#6B7280";
}

function summarize(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return {};

  const anime = await getAnimeById(id);
  if (!anime) return {};

  const title = anime.title_english || anime.title;
  const description = anime.synopsis
    ? summarize(anime.synopsis, 155)
    : `Track ${title} on AniVerse — episodes, airing schedule, and where to watch it.`;
  const image = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;

  return {
    title,
    description,
    keywords: [title, ...(anime.genres?.map((g) => g.name) ?? []), "anime", "watch anime"],
    alternates: { canonical: `/anime/${id}` },
    openGraph: {
      title,
      description,
      type: "video.tv_show",
      url: `/anime/${id}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function AnimeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const anime = await getAnimeById(id);
  if (!anime) notFound();

  const title = anime.title_english || anime.title;
  const backdrop = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const officialLinks = anime.streaming ?? [];

  // Structured data for search engines — enables rich results (ratings
  // stars, genre chips) in Google search. "TVSeries" is a reasonable
  // default for most anime; a single-episode title is treated as a movie.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": anime.episodes === 1 ? "Movie" : "TVSeries",
    name: title,
    ...(anime.title !== title ? { alternateName: anime.title } : {}),
    ...(anime.synopsis ? { description: anime.synopsis } : {}),
    ...(backdrop ? { image: backdrop } : {}),
    ...(anime.genres?.length ? { genre: anime.genres.map((g) => g.name) } : {}),
    ...(anime.aired?.from ? { datePublished: anime.aired.from } : {}),
    ...(anime.episodes && anime.episodes !== 1 ? { numberOfEpisodes: anime.episodes } : {}),
    ...(anime.score
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: anime.score,
            bestRating: 10,
            worstRating: 1,
            ratingCount: anime.scored_by ?? 1,
          },
        }
      : {}),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(jsonLd) }}
      />
      <div className="relative border-b border-line">
        {backdrop && (
          <div className="absolute inset-0">
            <Image src={backdrop} alt="" fill sizes="100vw" priority className="object-cover opacity-15" />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/90 to-void" />
          </div>
        )}

        <div className="container-page relative grid grid-cols-1 gap-8 py-12 sm:grid-cols-[220px_1fr] sm:py-16">
          <div className="relative aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-lg border border-line bg-panel">
            {backdrop && (
              <Image src={backdrop} alt={title} fill sizes="(max-width: 640px) 90vw, 220px" priority className="object-cover" />
            )}
          </div>

          <div>
            {anime.airing && (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-pink/40 bg-pink/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-pink">
                <span className="on-air-dot" /> Airing now
              </span>
            )}
            <h1 className="font-display text-4xl leading-none tracking-wide text-ink sm:text-5xl">
              {title}
            </h1>
            {anime.title !== title && (
              <p className="mt-2 text-sm text-ink-faint">{anime.title}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-ink-dim">
              {typeof anime.score === "number" && (
                <span className="text-amber">★ {anime.score.toFixed(2)}</span>
              )}
              {anime.episodes && <span>{anime.episodes} episodes</span>}
              {anime.status && <span>{anime.status}</span>}
              {anime.rating && <span>{anime.rating}</span>}
              {anime.broadcast?.string && <span>{anime.broadcast.string}</span>}
            </div>

            {!!anime.genres?.length && (
              <div className="mt-4 flex flex-wrap gap-2">
                {anime.genres.map((g) => (
                  <span
                    key={g.mal_id}
                    className="rounded-full border border-line px-3 py-1 text-xs text-ink-dim"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-dim">
              {anime.synopsis || "No synopsis available yet."}
            </p>

            <div className="mt-7">
              <WatchlistButton
                malId={anime.mal_id}
                title={title}
                imageUrl={
                  anime.images?.jpg?.image_url || anime.images?.jpg?.large_image_url || ""
                }
                totalEpisodes={anime.episodes ?? null}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <div>
          {anime.trailer?.embed_url && (
            <div>
              <h2 className="eyebrow mb-3">Trailer</h2>
              <div className="aspect-video overflow-hidden rounded-lg border border-line">
                <iframe
                  src={anime.trailer.embed_url}
                  title={`${title} trailer`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

        <aside>
          <h2 className="eyebrow mb-3">Where to watch</h2>
          <p className="mb-4 text-xs text-ink-faint">
            AniVerse doesn&apos;t host video. These links take you to the
            official platforms.
          </p>
          <div className="space-y-2">
            {officialLinks.length > 0
              ? officialLinks.map((s) => (
                  <a
                    key={s.name + s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-md border border-line px-4 py-3 text-sm text-ink transition-colors hover:border-cyan/50 hover:text-cyan"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: platformColor(s.name) }}
                      />
                      {s.name}
                    </span>
                    <span className="font-mono text-xs text-ink-faint">official ↗</span>
                  </a>
                ))
              : STREAMING_PLATFORMS.map((p) => (
                  <a
                    key={p.name}
                    href={`${p.base}${encodeURIComponent(title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-md border border-line px-4 py-3 text-sm text-ink transition-colors hover:border-cyan/50 hover:text-cyan"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                    <span className="font-mono text-xs text-ink-faint">search ↗</span>
                  </a>
                ))}
          </div>

          {!!anime.studios?.length && (
            <div className="mt-8">
              <h2 className="eyebrow mb-3">Studio</h2>
              <p className="text-sm text-ink-dim">
                {anime.studios.map((s) => s.name).join(", ")}
              </p>
            </div>
          )}
        </aside>
      </div>

      <ReviewSection animeMalId={id} />
      <CommentSection animeMalId={id} />
    </div>
  );
}
