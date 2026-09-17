import type { Metadata } from "next";
import { getSeasonNow, getUpcoming } from "@/core/clients/jikan";
import AnimeGrid from "@/components/features/home/AnimeGrid";

export const metadata: Metadata = {
  title: "Seasonal Anime Charts — AniVerse",
  description: "Browse the current anime season and upcoming releases.",
};

export const revalidate = 3600;

export default async function SeasonalPage() {
  const [season, upcoming] = await Promise.all([
    getSeasonNow(1).catch(() => ({ data: [] })),
    getUpcoming(1).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="container-page py-10 space-y-12">
      <div>
        <p className="eyebrow mb-1">Seasonal Timetable</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-ink">
          Seasonal <span className="text-cyan">Anime Charts</span>
        </h1>
        <p className="mt-2 text-sm text-ink-dim max-w-xl">
          Everything airing right now this season, plus anticipated titles scheduled for upcoming broadcasts.
        </p>
      </div>

      <AnimeGrid
        title="This Season's Airing Anime"
        eyebrow="Currently broadcasting"
        anime={season.data}
      />

      <AnimeGrid
        title="Upcoming Next Season"
        eyebrow="Coming soon"
        anime={upcoming.data}
      />
    </div>
  );
}
