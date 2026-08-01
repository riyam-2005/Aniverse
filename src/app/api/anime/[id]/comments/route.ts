import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const createSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment can't be empty")
    .max(1000, "Comment is too long (max 1000 characters)"),
});

export const GET = withApiHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const animeMalId = Number(params.id);
  if (!Number.isFinite(animeMalId)) {
    return apiError("Invalid anime id", 400, "VALIDATION_ERROR");
  }

  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const comments = await prisma.comment.findMany({
    where: { animeMalId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true } },
      likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
      _count: { select: { likes: true } },
    },
  });

  return apiOk(
    {
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: { id: c.user.id, name: c.user.name },
        likeCount: c._count.likes,
        likedByMe: currentUserId ? c.likes.length > 0 : false,
      })),
    },
    200,
    // private: this payload includes the viewer's own like state, so it
    // must never be served from a shared/CDN cache to a different user.
    { maxAge: 10, scope: "private" }
  );
});

export const POST = withApiHandler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const animeMalId = Number(params.id);
    if (!Number.isFinite(animeMalId)) {
      return apiError("Invalid anime id", 400, "VALIDATION_ERROR");
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return apiError("You need to sign in to comment.", 401, "UNAUTHENTICATED");
    }

    // 10 comments per user per 10 minutes — generous for real discussion,
    // tight enough to slow down spam/flooding.
    const rate = await checkRateLimit(`comment:${userId}`, 10, 10 * 60 * 1000);
    if (!rate.ok) {
      return apiError("You're commenting too fast. Please slow down.", 429, "RATE_LIMITED");
    }

    const body = await readJson(req);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
    }

    const comment = await prisma.comment.create({
      data: {
        animeMalId,
        userId,
        content: parsed.data.content,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Best-effort: ping other people watching this same title. Never let a
    // notification failure fail the comment itself — the comment already
    // succeeded above.
    try {
      const watchers = await prisma.watchlistItem.findMany({
        where: { malId: animeMalId, userId: { not: userId } },
        select: { userId: true, title: true },
        distinct: ["userId"],
      });

      for (const w of watchers) {
        const existingUnread = await prisma.notification.findFirst({
          where: { userId: w.userId, type: "NEW_COMMENT", animeMalId, read: false },
        });
        // One unread "new comment" ping per anime at a time — a burst of
        // comments shouldn't stack duplicate notifications for the same title.
        if (existingUnread) continue;

        await prisma.notification.create({
          data: {
            userId: w.userId,
            type: "NEW_COMMENT",
            animeMalId,
            message: `New comment on ${w.title}`,
          },
        });
      }
    } catch {
      // Notifications are a nice-to-have — swallow errors here rather than
      // turning a successful comment post into a 500.
    }

    return apiOk(
      {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: { id: comment.user.id, name: comment.user.name },
        likeCount: 0,
        likedByMe: false,
      },
      201
    );
  }
);
