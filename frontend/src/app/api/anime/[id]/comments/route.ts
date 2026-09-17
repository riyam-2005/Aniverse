import { z } from "zod";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";
import { ensureAnime } from "@/core/clients/anime.service";

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

  const user = await getUser();
  const supabase = createClient();

  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, content, created_at, user_id, like_count, profiles(id, username, display_name, avatar_url)")
    .eq("mal_id", animeMalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  let myLikedCommentIds = new Set<string>();
  if (user) {
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id);
    if (likes) {
      myLikedCommentIds = new Set(likes.map((l) => l.comment_id));
    }
  }

  return apiOk(
    {
      comments: (comments || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        user: {
          id: c.user_id,
          name: c.profiles?.display_name || c.profiles?.username || "Anime Fan",
          avatarUrl: c.profiles?.avatar_url,
        },
        likeCount: c.like_count || 0,
        likedByMe: myLikedCommentIds.has(c.id),
      })),
    },
    200,
    { maxAge: 10, scope: "private" }
  );
});

export const POST = withApiHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const animeMalId = Number(params.id);
  if (!Number.isFinite(animeMalId)) {
    return apiError("Invalid anime id", 400, "VALIDATION_ERROR");
  }

  const user = await getUser();
  if (!user) {
    return apiError("You need to sign in to comment.", 401, "UNAUTHENTICATED");
  }

  const rate = await checkRateLimit(`comment:${user.id}`, 10, 10 * 60 * 1000);
  if (!rate.ok) {
    return apiError("You're commenting too fast. Please slow down.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  await ensureAnime(animeMalId);

  const supabase = createClient();
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      mal_id: animeMalId,
      user_id: user.id,
      content: parsed.data.content,
    })
    .select("*, profiles(id, username, display_name, avatar_url)")
    .single();

  if (error) throw error;

  try {
    revalidatePath(`/anime/${animeMalId}`);
    revalidatePath("/community");
  } catch {
    // Non-critical cache revalidation catch
  }

  return apiOk(
    {
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      user: {
        id: user.id,
        name: (comment as any).profiles?.display_name || (comment as any).profiles?.username || "You",
      },
      likeCount: 0,
      likedByMe: false,
    },
    201
  );
});
