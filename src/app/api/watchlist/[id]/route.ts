import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";
const WATCH_STATUSES = ["PLANNING", "WATCHING", "COMPLETED", "ON_HOLD", "DROPPED"] as const;
const updateSchema = z.object({
  status: z.enum(WATCH_STATUSES).optional(),
  progress: z.number().int().min(0).max(100000).optional(),
  score: z.number().int().min(1).max(10).nullable().optional(),
});

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

async function requireOwnedItem(id: string, userId: string) {
  const item = await prisma.watchlistItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) return null;
  return item;
}

export function generateStaticParams() {
  return [{ id: "1" }];
}

export const PATCH = withApiHandler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    if (!userId) {
      return apiError("Not signed in", 401, "UNAUTHENTICATED");
    }

    const rate = await checkRateLimit(`watchlist-write:${userId}`, 30, 60 * 1000);
    if (!rate.ok) {
      return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
    }

    const owned = await requireOwnedItem(params.id, userId);
    if (!owned) {
      return apiError("Not found", 404, "NOT_FOUND");
    }

    const body = await readJson(req);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
    }

    const item = await prisma.watchlistItem.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return apiOk({ item });
  }
);

export const DELETE = withApiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    if (!userId) {
      return apiError("Not signed in", 401, "UNAUTHENTICATED");
    }

    const owned = await requireOwnedItem(params.id, userId);
    if (!owned) {
      return apiError("Not found", 404, "NOT_FOUND");
    }

    await prisma.watchlistItem.delete({ where: { id: params.id } });
    return apiOk({ ok: true });
  }
);
