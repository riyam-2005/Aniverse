import { apiOk, apiError, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";

export const POST = withApiHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await getUser();
  if (!user) return apiError("You need to sign in to react to reviews.", 401);

  const rate = await checkRateLimit(`review-like:${user.id}`, 40, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down.", 429, "RATE_LIMITED");
  }

  const supabase = createClient();
  const { data: review } = await supabase.from("reviews").select("id, likes_count").eq("id", params.id).single();
  if (!review) return apiError("Review not found", 404);

  const newLikes = (review.likes_count || 0) + 1;
  await supabase.from("reviews").update({ likes_count: newLikes }).eq("id", params.id);

  return apiOk({ liked: true, reviewId: params.id, likesCount: newLikes });
});
