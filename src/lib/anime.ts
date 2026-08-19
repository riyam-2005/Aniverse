import { prisma } from "@/lib/prisma";

/**
 * Ensures an `Anime` row exists in the database for the given MAL ID.
 * Because schema-1.prisma adds foreign key constraints referencing `Anime.malId`
 * across WatchlistItem, Comment, Review, Notification, etc., this helper
 * lazily upserts the `Anime` record before creating dependent rows.
 */
export async function ensureAnime(
  malId: number,
  title: string = `Anime #${malId}`,
  imageUrl: string = ""
) {
  return prisma.anime.upsert({
    where: { malId },
    update: {
      ...(title !== `Anime #${malId}` ? { title } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    },
    create: {
      malId,
      title,
      imageUrl,
    },
  });
}
