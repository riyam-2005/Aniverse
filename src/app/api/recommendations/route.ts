import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, withApiHandler } from "@/lib/api";
import { getTopAnime } from "@/lib/jikan";
import { FALLBACK_ANIME } from "@/lib/fallback-anime";

export const GET = withApiHandler(async () => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    // Fallback for unauthenticated visitors: top airing anime
    const topData = await getTopAnime(1).catch(() => ({ data: FALLBACK_ANIME }));
    return apiOk({
      anime: (topData.data || FALLBACK_ANIME).slice(0, 10),
      basedOnTitles: ["Trending Masterpieces"],
      mode: "watchlist",
    });
  }

  // Fetch user data: preferred genres & watch history/watchlist
  const [user, watchlist, watchHistory] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { preferredGenres: true },
    }),
    prisma.watchlistItem.findMany({
      where: { userId },
      select: { malId: true, title: true, status: true, score: true },
      take: 20,
    }),
    prisma.watchHistory.findMany({
      where: { userId },
      select: { malId: true },
      orderBy: { watchedAt: "desc" },
      take: 10,
    }),
  ]);

  const watchedMalIds = new Set([
    ...watchlist.map((w) => w.malId),
    ...watchHistory.map((h) => h.malId),
  ]);

  const basedOnTitles = watchlist.slice(0, 3).map((w) => w.title);

  // Fetch top anime pool to filter recommendations
  const pool = await getTopAnime(1).catch(() => ({ data: FALLBACK_ANIME }));
  const rawList = pool.data || FALLBACK_ANIME;

  // Filter out titles already in user's watchlist/history
  const recommended = rawList.filter((anime) => !watchedMalIds.has(anime.mal_id));

  return apiOk({
    anime: (recommended.length > 0 ? recommended : FALLBACK_ANIME).slice(0, 10),
    basedOnTitles: basedOnTitles.length > 0 ? basedOnTitles : ["Popular Airing"],
    mode: watchlist.length > 0 ? "watchlist" : "genres",
  });
});
