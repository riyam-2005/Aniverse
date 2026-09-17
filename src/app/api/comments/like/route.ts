import { apiOk, apiError, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";

export const POST = withApiHandler(async (_req, { params }: { params?: { commentId?: string } } = {}) => {
  const user = await getUser();
  if (!user) return apiError("You need to sign in to like a comment.", 401);

  const commentId = params?.commentId;
  if (!commentId) return apiError("Missing comment id", 400);

  const rate = await checkRateLimit(`comment-like:${user.id}`, 60, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
  }

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase.from("comment_likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("comment_likes").insert({
      comment_id: commentId,
      user_id: user.id,
    });
  }

  const { count } = await supabase
    .from("comment_likes")
    .select("id", { count: "exact", head: true })
    .eq("comment_id", commentId);

  const newCount = count || 0;
  await supabase.from("comments").update({ like_count: newCount }).eq("id", commentId);

  return apiOk({ liked: !existing, likeCount: newCount });
});
