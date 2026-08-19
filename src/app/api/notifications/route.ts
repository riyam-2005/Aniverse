import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/notifications
 * Returns the current user's most recent notifications plus an unread
 * count. Polled client-side every ~20s by NotificationBell — cheap enough
 * for that cadence since it's a single indexed query.
 */
export const GET = withApiHandler(async () => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Not signed in.", 401);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ]);

  return apiOk({ notifications, unreadCount });
});

const readSchema = z.object({
  // Omit id to mark everything as read at once; pass one to mark just that.
  id: z.string().optional(),
});

/**
 * PATCH /api/notifications
 * Marks one notification (or all of them) as read for the current user.
 */
export const PATCH = withApiHandler(async (req) => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Not signed in.", 401);

  // 60 mark-as-read calls per user per minute — the client fires one on
  // click and one on "mark all read", so this is generous for real usage
  // while still stopping a script from spamming the write.
  const rate = await checkRateLimit(`notifications-read:${userId}`, 60, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = readSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  await prisma.notification.updateMany({
    where: {
      userId,
      ...(parsed.data.id ? { id: parsed.data.id } : {}),
    },
    data: { read: true },
  });

  return apiOk({ ok: true });
});
