import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, withApiHandler } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/comments/like/[commentId]
 * Toggles the current user's like on a comment — liking again un-likes it.
 * Returns the new like count and whether the current user now likes it,
 * so the client can update in place without a full re-fetch.
 */
export const POST = withApiHandler(async (_req, { params }: { params: { commentId: string } }) => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("You need to sign in to like a comment.", 401);

  // 60 like/unlike toggles per user per minute — plenty for real usage,
  // enough to stop a script from hammering the like-count aggregate.
  const rate = await checkRateLimit(`comment-like:${userId}`, 60, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
  }

  const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
  if (!comment) return apiError("Comment not found.", 404);

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId: params.commentId, userId } },
  });

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.commentLike.create({
      data: { commentId: params.commentId, userId },
    });
  }

  const likeCount = await prisma.commentLike.count({ where: { commentId: params.commentId } });

  return apiOk({ liked: !existing, likeCount });
});
