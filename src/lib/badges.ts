import { prisma } from "@/lib/prisma";

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
    description: "Account email or phone verified",
    icon: "✓",
  },
  TOP_REVIEWER: {
    key: "TOP_REVIEWER",
    label: "Top Critic",
    description: "Authored 5+ detailed anime reviews",
    icon: "✍️",
  },
  ANIME_VETERAN: {
    key: "ANIME_VETERAN",
    label: "Anime Veteran",
    description: "Added 25+ titles to watchlist",
    icon: "🏆",
  },
  BINGE_WATCHER: {
    key: "BINGE_WATCHER",
    label: "Binge Master",
    description: "Completed 10+ anime series",
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
 * Evaluates user stats and grants appropriate badges automatically.
 */
export async function syncUserBadges(userId: string) {
  const [user, watchlistCount, completedCount, reviewCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { preferredGenres: true, phoneVerifiedAt: true },
    }),
    prisma.watchlistItem.count({ where: { userId } }),
    prisma.watchlistItem.count({ where: { userId, status: "COMPLETED" } }),
    prisma.review.count({ where: { userId } }),
  ]);

  if (!user) return [];

  const earnedKeys: string[] = [];

  if (user.phoneVerifiedAt) earnedKeys.push("VERIFIED");
  if (reviewCount >= 5) earnedKeys.push("TOP_REVIEWER");
  if (watchlistCount >= 25) earnedKeys.push("ANIME_VETERAN");
  if (completedCount >= 10) earnedKeys.push("BINGE_WATCHER");
  if (user.preferredGenres && user.preferredGenres.trim().length > 0) {
    earnedKeys.push("GENRE_EXPLORER");
  }

  // Ensure badges exist in catalog table
  for (const key of Object.keys(SYSTEM_BADGES)) {
    const info = SYSTEM_BADGES[key];
    await prisma.badge.upsert({
      where: { key },
      update: { label: info.label, description: info.description },
      create: { key, label: info.label, description: info.description },
    });
  }

  // Award missing badges to user
  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
  });

  const existingKeys = new Set(existingBadges.map((b) => b.badge.key));

  for (const key of earnedKeys) {
    if (!existingKeys.has(key)) {
      const badge = await prisma.badge.findUnique({ where: { key } });
      if (badge) {
        await prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
      }
    }
  }

  const updatedUserBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { awardedAt: "desc" },
  });

  return updatedUserBadges.map((ub) => ({
    key: ub.badge.key,
    label: ub.badge.label,
    description: ub.badge.description,
    awardedAt: ub.awardedAt,
    icon: SYSTEM_BADGES[ub.badge.key]?.icon || "🎖️",
  }));
}
