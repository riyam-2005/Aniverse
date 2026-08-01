import { prisma } from "@/lib/prisma";
import { apiOk, apiError, withApiHandler } from "@/lib/api";
import { getAnimeById } from "@/lib/jikan";

/**
 * GET /api/cron/check-episodes
 *
 * Triggered on a schedule (see vercel.json) rather than by a user action —
 * Vercel's serverless functions can't hold a background timer themselves,
 * so a Cron Job hitting this route is what stands in for "watch for new
 * episodes" on this hosting setup.
 *
 * For every anime someone is actively watching:
 *   1. Fetch its current episode count from Jikan (cached 1h by getAnimeById,
 *      so this is cheap even if the cron runs every few hours).
 *   2. Compare against the last count we saw (AnimeEpisodeCache).
 *   3. If it went up, notify everyone with that title set to WATCHING.
 *
 * Protected by CRON_SECRET so this can't be triggered by anyone who finds
 * the URL — Vercel Cron sends this automatically as a bearer token.
 */
export const GET = withApiHandler(async (req) => {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const watching = await prisma.watchlistItem.findMany({
    where: { status: "WATCHING" },
    select: { malId: true, title: true },
    distinct: ["malId"],
  });

  let notified = 0;

  for (const item of watching) {
    const anime = await getAnimeById(item.malId);
    if (!anime?.episodes) continue;

    const cached = await prisma.animeEpisodeCache.findUnique({
      where: { malId: item.malId },
    });

    // First time we've ever seen this title — record the baseline without
    // notifying (otherwise everyone gets pinged the first time a title is
    // added, not just when a *new* episode airs).
    if (!cached) {
      await prisma.animeEpisodeCache.create({
        data: { malId: item.malId, lastEpisodes: anime.episodes },
      });
      continue;
    }

    if (anime.episodes > cached.lastEpisodes) {
      const watchers = await prisma.watchlistItem.findMany({
        where: { malId: item.malId, status: "WATCHING" },
        select: { userId: true },
        distinct: ["userId"],
      });

      for (const w of watchers) {
        await prisma.notification.create({
          data: {
            userId: w.userId,
            type: "NEW_EPISODE",
            animeMalId: item.malId,
            message: `Episode ${anime.episodes} of ${item.title} is out`,
          },
        });
        notified++;
      }

      await prisma.animeEpisodeCache.update({
        where: { malId: item.malId },
        data: { lastEpisodes: anime.episodes },
      });
    }
  }

  return apiOk({ checked: watching.length, notified });
});
