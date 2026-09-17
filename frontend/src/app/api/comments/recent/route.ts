import { apiOk, withApiHandler } from "@/core/utils/api";
import { createClient } from "@/core/clients/supabase-server";
import { getAnimeById } from "@/core/clients/jikan";

export const GET = withApiHandler(async (req) => {
  const sort = new URL(req.url).searchParams.get("sort") === "top" ? "top" : "newest";
  const supabase = createClient();

  let query = supabase
    .from("comments")
    .select("id, content, created_at, mal_id, user_id, like_count, profiles(display_name, username)")
    .is("deleted_at", null)
    .limit(12);

  if (sort === "top") {
    query = query.order("like_count", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: comments, error } = await query;
  if (error) throw error;

  const list = comments || [];
  const uniqueIds = Array.from(new Set(list.map((c) => c.mal_id)));

  const animeById = new Map(
    (
      await Promise.all(
        uniqueIds.map(async (id) => [id, await getAnimeById(id)] as const)
      )
    ).filter(([, anime]) => anime !== null)
  );

  return apiOk(
    {
      comments: list.map((c: any) => {
        const anime = animeById.get(c.mal_id);
        const authorName = c.profiles?.display_name || c.profiles?.username || "Anime Fan";
        return {
          id: c.id,
          content: c.content,
          createdAt: c.created_at,
          animeMalId: c.mal_id,
          animeTitle: anime?.title_english || anime?.title || `Anime #${c.mal_id}`,
          likeCount: c.like_count || 0,
          user: { name: authorName },
        };
      }),
    },
    200,
    { maxAge: 30, scope: "public" }
  );
});
