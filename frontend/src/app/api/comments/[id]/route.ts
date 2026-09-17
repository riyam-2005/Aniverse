import { apiOk, apiError, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";

export const DELETE = withApiHandler(
  async (_req, { params }: { params: { id: string } }) => {
    const user = await getUser();
    if (!user) return apiError("You need to sign in.", 401);

    const rate = await checkRateLimit(`comment-delete:${user.id}`, 30, 10 * 60 * 1000);
    if (!rate.ok) {
      return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
    }

    const supabase = createClient();
    const { data: comment } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", params.id)
      .single();

    if (!comment) return apiError("Comment not found.", 404);
    if (comment.user_id !== user.id) {
      return apiError("You can only delete your own comments.", 403);
    }

    const { error } = await supabase.from("comments").delete().eq("id", params.id);
    if (error) throw error;

    return apiOk({ deleted: true });
  }
);
