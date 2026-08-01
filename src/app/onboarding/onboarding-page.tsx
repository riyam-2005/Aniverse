import type { Metadata } from "next";
import { getGenres } from "@/lib/jikan";
import GenrePicker from "@/components/GenrePicker";

export const metadata: Metadata = {
  title: "Welcome — AniVerse",
  robots: { index: false },
};

const FEATURED_GENRE_IDS = [1, 2, 4, 8, 10, 22, 24, 27, 30, 36, 37, 41];

export default async function OnboardingPage() {
  const genresRaw = await getGenres().catch(() => []);
  const genres = genresRaw.filter((g) => FEATURED_GENRE_IDS.includes(g.mal_id));

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-2xl">
        <p className="eyebrow mb-1.5">Welcome to AniVerse</p>
        <h1 className="font-display text-3xl tracking-wide text-ink sm:text-4xl">
          What do you like watching?
        </h1>
        <p className="mt-2 max-w-lg text-sm text-ink-dim">
          Pick a few genres so we can recommend something before you've
          added anything to your watchlist. You can always change this
          later — it just gets better the more you watch.
        </p>

        <div className="mt-8">
          <GenrePicker genres={genres} />
        </div>
      </div>
    </div>
  );
}
