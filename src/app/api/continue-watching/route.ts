import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureAnime } from "@/lib/anime";

const updateSchema = z.object({
  malId: z.number().int().positive(),
  title: z.string().trim().min(1),
  imageUrl: z.string().url(),
  episodeNumber: z.number().int().positive().default(1),
  timestampSec: z.number().int().min(0).default(0),
  durationSec: z.number().int().positive().optional(),
});

export const GET = withApiHandler(async () => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return apiOk({ items: [] });
  }

  const items = await prisma.continueWatching.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  return apiOk({
    items: items.map((item) => ({
      id: item.id,
      malId: item.malId,
      title: item.title,
      imageUrl: item.imageUrl,
      episodeNumber: item.episodeNumber,
      timestampSec: item.timestampSec,
      durationSec: item.durationSec,
      updatedAt: item.updatedAt,
    })),
  });
});

export const POST = withApiHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return apiError("Sign in to track continue watching progress", 401, "UNAUTHENTICATED");
  }

  const rate = await checkRateLimit(`continue-watching:${userId}`, 60, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many progress updates.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid payload", 400, "VALIDATION_ERROR");
  }

  const { malId, title, imageUrl, episodeNumber, timestampSec, durationSec } = parsed.data;

  await ensureAnime(malId, title, imageUrl);

  // Update current Continue Watching pointer
  const record = await prisma.continueWatching.upsert({
    where: { userId_malId: { userId, malId } },
    update: {
      title,
      imageUrl,
      episodeNumber,
      timestampSec,
      durationSec,
    },
    create: {
      userId,
      malId,
      title,
      imageUrl,
      episodeNumber,
      timestampSec,
      durationSec,
    },
  });

  // Log to append-only WatchHistory for analytics/recommendations
  await prisma.watchHistory.create({
    data: {
      userId,
      malId,
      episodeNumber,
      progressSec: timestampSec,
    },
  });

  return apiOk({ item: record }, 200);
});
