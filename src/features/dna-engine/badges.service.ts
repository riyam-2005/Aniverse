import { createClient } from "@/core/clients/supabase-server";

export interface BadgeInfo {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export const SYSTEM_BADGES: Record<string, BadgeInfo> = {
  VERIFIED: {
    key: "VERIFIED",
    label: "Verified Otaku",
    description: "Account email verified",
    icon: "✓",
  },
  TOP_REVIEWER: {
    key: "TOP_REVIEWER",
    label: "Top Critic",
    description: "Authored 3+ detailed anime reviews",
    icon: "✍️",
  },
  ANIME_VETERAN: {
    key: "ANIME_VETERAN",
    label: "Anime Veteran",
    description: "Added 15+ titles to library",
    icon: "🏆",
  },
  BINGE_WATCHER: {
    key: "BINGE_WATCHER",
    label: "Binge Master",
    description: "Completed 5+ anime series",
    icon: "🍿",
  },
  GENRE_EXPLORER: {
    key: "GENRE_EXPLORER",
    label: "Genre Explorer",
    description: "Explored and set custom genre preferences",
    icon: "🌟",
  },
};

/**
 * Evaluates user stats and computes badges dynamically using Supabase.
 */
export async function syncUserBadges(userId: string) {
  const supabase = createClient();

  const [prefsRes, libraryRes, reviewsRes] = await Promise.all([
    supabase.from("user_preferences").select("favorite_genres").eq("user_id", userId).single(),
    supabase.from("user_anime").select("status").eq("user_id", userId),
    supabase.from("reviews").select("id").eq("user_id", userId),
  ]);

  const libraryItems = libraryRes.data ?? [];
  const watchlistCount = libraryItems.length;
  const completedCount = libraryItems.filter((item) => item.status === "COMPLETED").length;
  const reviewCount = reviewsRes.data?.length ?? 0;
  const favoriteGenres = (prefsRes.data?.favorite_genres as number[] | null) ?? [];

  const earnedKeys: string[] = ["VERIFIED"]; // verified by default upon auth account creation
  if (reviewCount >= 3) earnedKeys.push("TOP_REVIEWER");
  if (watchlistCount >= 15) earnedKeys.push("ANIME_VETERAN");
  if (completedCount >= 5) earnedKeys.push("BINGE_WATCHER");
  if (favoriteGenres.length > 0) earnedKeys.push("GENRE_EXPLORER");

  return earnedKeys.map((key) => {
    const badge = SYSTEM_BADGES[key];
    return {
      key,
      label: badge.label,
      description: badge.description,
      icon: badge.icon,
      awardedAt: new Date(),
    };
  });
}
