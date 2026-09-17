import { z } from "zod";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";
import { ensureAnime } from "@/core/clients/anime.service";

const upsertSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 10").max(10, "Rating must be between 1 and 10"),
  title: z.string().trim().max(100).optional(),
  content: z.string().trim().max(2000, "Review is too long (max 2000 characters)").optional(),
  body: z.string().trim().max(2000).optional(), // compatibility with body alias
});

export const GET = withApiHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const animeMalId = Number(params.id);
  if (!Number.isFinite(animeMalId)) {
    return apiError("Invalid anime id", 400, "VALIDATION_ERROR");
  }

  const supabase = createClient();
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, mal_id, rating, title, content, created_at, updated_at, user_id, profiles(id, username, display_name, avatar_url)")
    .eq("mal_id", animeMalId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const list = reviews || [];
  const ratings = list.map((r) => r.rating);
  const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return apiOk(
    {
      reviews: list.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.content,
        content: r.content,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        user: {
          id: r.user_id,
          name: r.profiles?.display_name || r.profiles?.username || "Anime Fan",
          avatarUrl: r.profiles?.avatar_url,
        },
      })),
      average,
      count: list.length,
    },
    200,
    { maxAge: 30, scope: "public" }
  );
});

export const POST = withApiHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const animeMalId = Number(params.id);
  if (!Number.isFinite(animeMalId)) {
    return apiError("Invalid anime id", 400, "VALIDATION_ERROR");
  }

  const user = await getUser();
  if (!user) {
    return apiError("You need to sign in to leave a review.", 401, "UNAUTHENTICATED");
  }

  const rate = await checkRateLimit(`review:${user.id}`, 20, 10 * 60 * 1000);
  if (!rate.ok) {
    return apiError("You're doing that too fast. Please slow down.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  await ensureAnime(animeMalId);

  const supabase = createClient();
  const reviewContent = parsed.data.content || parsed.data.body || null;

  const { data: review, error } = await supabase
    .from("reviews")
    .upsert(
      {
        user_id: user.id,
        mal_id: animeMalId,
        rating: parsed.data.rating,
        title: parsed.data.title || null,
        content: reviewContent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,mal_id" }
    )
    .select("*, profiles(id, username, display_name, avatar_url)")
    .single();

  if (error) throw error;

  try {
    revalidatePath(`/anime/${animeMalId}`);
    revalidatePath("/app/profile");
    revalidatePath("/community");
  } catch (err) {
    console.error("[reviews] revalidatePath error:", err);
  }

  return apiOk({
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.content,
    content: review.content,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
    user: {
      id: user.id,
      name: (review as any).profiles?.display_name || (review as any).profiles?.username || "You",
    },
  });
});

export const DELETE = withApiHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const animeMalId = Number(params.id);
  if (!Number.isFinite(animeMalId)) {
    return apiError("Invalid anime id", 400, "VALIDATION_ERROR");
  }

  const user = await getUser();
  if (!user) {
    return apiError("Not signed in", 401, "UNAUTHENTICATED");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("user_id", user.id)
    .eq("mal_id", animeMalId);

  if (error) throw error;

  try {
    revalidatePath(`/anime/${animeMalId}`);
    revalidatePath("/app/profile");
    revalidatePath("/community");
  } catch (err) {
    console.error("[reviews] revalidatePath error:", err);
  }

  return apiOk({ ok: true });
});
