import { createClient } from "@/core/clients/supabase-server";

export interface GenreAffinity {
  name: string;
  count: number;
  percentage: number;
}

export interface EvolutionSnapshot {
  period: string;
  episodes: number;
  hours: number;
  archetypeBadge: string;
  archetypeTitle: string;
}

export interface AnimeDnaProfile {
  totalTitles: number;
  completedTitles: number;
  totalEpisodesWatched: number;
  totalHoursWatched: number;
  averageRating: number | null;
  topGenres: GenreAffinity[];
  archetype: {
    title: string;
    badge: string;
    description: string;
  };
  preferredEpisodeLength: string;
  evolutionTimeline: EvolutionSnapshot[];
}

const GENRE_MAP: Record<number, string> = {
  1: "Action",
  2: "Adventure",
  4: "Comedy",
  7: "Mystery",
  8: "Drama",
  10: "Fantasy",
  14: "Horror",
  18: "Mecha",
  19: "Music",
  22: "Romance",
  24: "Sci-Fi",
  30: "Sports",
  36: "Slice of Life",
  37: "Supernatural",
  40: "Psychological",
  41: "Thriller",
};

/**
 * Calculates user's Anime DNA based on their library, ratings, and watch activity.
 */
export async function calculateAnimeDna(userId: string): Promise<AnimeDnaProfile> {
  const supabase = createClient();

  const [libraryRes, reviewsRes, prefsRes, historyRes] = await Promise.all([
    supabase
      .from("user_anime")
      .select("status, current_episode, total_episodes, score, is_favorite, created_at, updated_at")
      .eq("user_id", userId),
    supabase
      .from("reviews")
      .select("rating")
      .eq("user_id", userId),
    supabase
      .from("user_preferences")
      .select("favorite_genres")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("watch_history")
      .select("watched_at, episode_number")
      .eq("user_id", userId)
      .order("watched_at", { ascending: true })
      .limit(100),
  ]);

  const library = libraryRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const favoriteGenreIds: number[] = (prefsRes.data?.favorite_genres as number[] | null) ?? [];

  const totalTitles = library.length;
  const completedTitles = library.filter((item) => item.status === "COMPLETED").length;

  let totalEpisodesWatched = 0;
  for (const item of library) {
    if (item.status === "COMPLETED") {
      totalEpisodesWatched += item.total_episodes || item.current_episode || 12;
    } else {
      totalEpisodesWatched += item.current_episode || 0;
    }
  }

  const totalHoursWatched = Math.round((totalEpisodesWatched * 23.5) / 60);

  // Average Rating
  const scores: number[] = [];
  for (const item of library) {
    if (item.score) scores.push(item.score);
  }
  for (const rev of reviews) {
    if (rev.rating) scores.push(rev.rating);
  }

  const averageRating =
    scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null;

  // Genre Distribution
  const genreCount: Record<string, number> = {};
  for (const id of favoriteGenreIds) {
    const name = GENRE_MAP[id] || `Genre #${id}`;
    genreCount[name] = (genreCount[name] || 0) + 3;
  }

  // Add baseline genres if user has empty data
  if (Object.keys(genreCount).length === 0) {
    genreCount["Action"] = 5;
    genreCount["Psychological"] = 4;
    genreCount["Drama"] = 3;
    genreCount["Sci-Fi"] = 2;
  }

  const maxGenreVal = Math.max(...Object.values(genreCount), 1);
  const topGenres: GenreAffinity[] = Object.entries(genreCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.min(98, Math.max(35, Math.round((count / maxGenreVal) * 92))),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);

  // Determine Archetype
  let archetype = {
    title: "THE ECLECTIC EXPLORER",
    badge: "🌌",
    description: "You appreciate a wide array of storytelling styles, from high-stakes battles to intimate character studies.",
  };

  const topGenreName = topGenres[0]?.name;
  if (topGenreName === "Psychological" || topGenreName === "Mystery") {
    archetype = {
      title: "THE MASTERMIND STRATEGIST",
      badge: "🧠",
      description: "You love complex narratives, mind games, multi-layered plotting, and morally grey protagonists.",
    };
  } else if (topGenreName === "Action" || topGenreName === "Adventure") {
    archetype = {
      title: "THE SHONEN CHAMPION",
      badge: "🔥",
      description: "You thrive on hype battles, heroic perseverance, power progressions, and unforgettable tournament arcs.",
    };
  } else if (topGenreName === "Romance" || topGenreName === "Slice of Life") {
    archetype = {
      title: "THE WHOLESOME PHILOSOPHER",
      badge: "☕",
      description: "You value emotional depth, cozy atmospheres, heartwarming friendships, and beautiful everyday moments.",
    };
  } else if (topGenreName === "Sci-Fi" || topGenreName === "Mecha") {
    archetype = {
      title: "THE CYBERNETIC VISIONARY",
      badge: "⚡",
      description: "You are fascinated by futuristic world-building, high-tech speculative concepts, and cyber aesthetics.",
    };
  } else if (topGenreName === "Drama" || topGenreName === "Fantasy") {
    archetype = {
      title: "THE EPIC MYTHMAKER",
      badge: "⚔️",
      description: "You are drawn to grand world-building, high fantasy stakes, emotional crescendos, and legendary journeys.",
    };
  }

  // Calculate Evolution Timeline based on watch activity
  const history = historyRes?.data ?? [];
  const monthMap: Record<string, number> = {};

  for (const h of history) {
    if (h.watched_at) {
      const d = new Date(h.watched_at);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      monthMap[key] = (monthMap[key] || 0) + 1;
    }
  }

  const evolutionTimeline: EvolutionSnapshot[] = [];
  const monthKeys = Object.keys(monthMap);

  if (monthKeys.length > 0) {
    for (const period of monthKeys) {
      const eps = monthMap[period];
      const hrs = Math.round((eps * 23.5) / 60);
      evolutionTimeline.push({
        period,
        episodes: eps,
        hours: hrs,
        archetypeBadge: archetype.badge,
        archetypeTitle: archetype.title,
      });
    }
  } else {
    // Generate realistic progression curve from baseline to current activity
    const now = new Date();
    const curMonth = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    evolutionTimeline.push(
      {
        period: prevMonth,
        episodes: Math.max(1, Math.round(totalEpisodesWatched * 0.35)),
        hours: Math.max(1, Math.round(totalHoursWatched * 0.35)),
        archetypeBadge: "🌌",
        archetypeTitle: "THE ECLECTIC EXPLORER",
      },
      {
        period: curMonth,
        episodes: totalEpisodesWatched,
        hours: totalHoursWatched,
        archetypeBadge: archetype.badge,
        archetypeTitle: archetype.title,
      }
    );
  }

  return {
    totalTitles,
    completedTitles,
    totalEpisodesWatched,
    totalHoursWatched,
    averageRating,
    topGenres,
    archetype,
    preferredEpisodeLength: totalEpisodesWatched > 50 ? "12–25 Episodes (Standard TV)" : "Short (<13 Episodes)",
    evolutionTimeline,
  };
}
