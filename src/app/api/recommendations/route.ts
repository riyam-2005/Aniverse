import { apiOk, withApiHandler } from "@/core/utils/api";
import { createClient, getUser } from "@/core/clients/supabase-server";
import { getTopAnime, getAnimeByGenre } from "@/core/clients/jikan";
import { FALLBACK_ANIME } from "@/features/ai-companion/fallback.service";
import type { Anime } from "@/types/anime";

export const GET = withApiHandler(async () => {
  const user = await getUser();

  if (!user) {
    // Unauthenticated visitors: top airing anime
    const topData = await getTopAnime(1).catch(() => ({ data: FALLBACK_ANIME }));
    return apiOk({
      anime: (topData.data || FALLBACK_ANIME).slice(0, 12),
      basedOnTitles: ["Trending Masterpieces"],
      mode: "watchlist",
    });
  }

  const supabase = createClient();

  // Fetch user library, history, and preferences from Supabase
  const [libraryRes, historyRes, prefsRes] = await Promise.all([
    supabase.from("user_anime").select("mal_id, title, status, score").eq("user_id", user.id).limit(25),
    supabase.from("watch_history").select("mal_id").eq("user_id", user.id).order("watched_at", { ascending: false }).limit(10),
    supabase.from("user_preferences").select("favorite_genres").eq("user_id", user.id).single(),
  ]);

  const library = libraryRes.data ?? [];
  const history = historyRes.data ?? [];
  const favoriteGenreIds: number[] = (prefsRes.data?.favorite_genres as number[] | null) ?? [];

  const watchedMalIds = new Set<number>([
    ...library.map((w) => w.mal_id),
    ...history.map((h) => h.mal_id),
  ]);

  const basedOnTitles = library.slice(0, 3).map((w) => w.title);

  // If user has preferred genres, fetch from top preferred genre
  let candidates: Anime[] = [];
  if (favoriteGenreIds.length > 0) {
    const genreRes = await getAnimeByGenre(favoriteGenreIds[0], 1).catch(() => ({ data: [] }));
    candidates = genreRes.data || [];
  }

  if (candidates.length === 0) {
    const pool = await getTopAnime(1).catch(() => ({ data: FALLBACK_ANIME }));
    candidates = pool.data || FALLBACK_ANIME;
  }

  // Filter out already watched titles
  const recommended = candidates.filter((anime) => !watchedMalIds.has(anime.mal_id));

  return apiOk({
    anime: (recommended.length > 0 ? recommended : FALLBACK_ANIME).slice(0, 12),
    basedOnTitles: basedOnTitles.length > 0 ? basedOnTitles : ["Curated Selection"],
    mode: library.length > 0 ? "watchlist" : "genres",
  });
});
