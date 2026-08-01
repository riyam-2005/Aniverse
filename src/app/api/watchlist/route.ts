import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";
const WATCH_STATUSES = ["PLANNING", "WATCHING", "COMPLETED", "ON_HOLD", "DROPPED"] as const;

const addSchema = z.object({
  malId: z.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  imageUrl: z.string().url(),
  totalEpisodes: z.number().int().positive().nullable().optional(),
  status: z.enum(WATCH_STATUSES).default("PLANNING"),
});

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export const GET = withApiHandler(async () => {
  const userId = await requireUserId();
  if (!userId) {
    return apiError("Not signed in", 401, "UNAUTHENTICATED");
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return apiOk({ items });
});

export const POST = withApiHandler(async (req: Request) => {
  const userId = await requireUserId();
  if (!userId) {
    return apiError("Not signed in", 401, "UNAUTHENTICATED");
  }

  // 30 watchlist writes per minute per user is generous for real usage,
  // but stops a runaway client/script from hammering the DB.
  const rate =await checkRateLimit(`watchlist-write:${userId}`, 30, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const item = await prisma.watchlistItem.upsert({
    where: { userId_malId: { userId, malId: parsed.data.malId } },
    update: { status: parsed.data.status },
    create: { userId, ...parsed.data },
  });

  return apiOk({ item }, 201);
});
