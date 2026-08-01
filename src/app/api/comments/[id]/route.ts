import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, withApiHandler } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * DELETE /api/comments/[id]
 *
 * `id` here is the comment's own id (not an anime id — see
 * src/app/api/anime/[id]/comments/route.ts for anime-scoped list/create,
 * which is where the "New" in "New comment" actually happens; this
 * route's POST handler used to duplicate that logic while never actually
 * being called by the client — removed as dead code).
 *
 * Only the comment's author can delete it. CommentLikes cascade-delete
 * automatically (see `onDelete: Cascade` on CommentLike.comment in
 * schema.prisma) — no manual cleanup needed here.
 */
export function generateStaticParams() {
  return [{ id: "1" }];
}

export const DELETE = withApiHandler(
  async (_req, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return apiError("You need to sign in.", 401);

    // 30 deletes per user per 10 minutes — plenty for real cleanup,
    // enough to stop a script from mass-deleting via this endpoint.
    const rate = await checkRateLimit(`comment-delete:${userId}`, 30, 10 * 60 * 1000);
    if (!rate.ok) {
      return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
    }

    const comment = await prisma.comment.findUnique({ where: { id: params.id } });
    if (!comment) return apiError("Comment not found.", 404);
    if (comment.userId !== userId) {
      return apiError("You can only delete your own comments.", 403);
    }

    await prisma.comment.delete({ where: { id: params.id } });
    return apiOk({ deleted: true });
  }
);
