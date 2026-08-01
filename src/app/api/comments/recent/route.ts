import { prisma } from "@/lib/prisma";
import { apiOk, withApiHandler } from "@/lib/api";
import { getAnimeById } from "@/lib/jikan";

/**
 * GET /api/comments/recent?sort=newest|top
 *
 * "newest" — most recent comments, chronological.
 * "top" — a genuinely separate query ordered by like count, not just the
 * newest 12 re-sorted client-side (an earlier version of this route did
 * that, using comment length as a stand-in for "quality" before real
 * likes existed — replaced now that CommentLike is a real thing).
 *
 * Anime titles are resolved server-side (deduped + parallel, cached an
 * hour by getAnimeById) so the client component can render immediately.
 */
export const GET = withApiHandler(async (req) => {
  const sort = new URL(req.url).searchParams.get("sort") === "top" ? "top" : "newest";

  const comments = await prisma.comment.findMany({
    orderBy:
      sort === "top"
        ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }]
        : { createdAt: "desc" },
    take: 12,
    include: { user: { select: { name: true } }, _count: { select: { likes: true } } },
  });

  const uniqueIds = [...new Set(comments.map((c) => c.animeMalId))];
  const animeById = new Map(
    (
      await Promise.all(
        uniqueIds.map(async (id) => [id, await getAnimeById(id)] as const)
      )
    ).filter(([, anime]) => anime !== null)
  );

  return apiOk(
    {
      comments: comments.map((c) => {
        const anime = animeById.get(c.animeMalId);
        return {
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          animeMalId: c.animeMalId,
          animeTitle: anime?.title_english || anime?.title || `Anime #${c.animeMalId}`,
          likeCount: c._count.likes,
          user: { name: c.user.name },
        };
      }),
    },
    200,
    { maxAge: 30, scope: "public" }
  );
});
