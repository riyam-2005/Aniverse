import { z } from "zod";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";
import { ensureAnime } from "@/core/clients/anime.service";

const WATCH_STATUSES = ["PLANNING", "PLAN_TO_WATCH", "WATCHING", "COMPLETED", "ON_HOLD", "DROPPED"] as const;

const addSchema = z.object({
  malId: z.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  imageUrl: z.string().url().optional().or(z.literal("")),
  totalEpisodes: z.number().int().positive().nullable().optional(),
  status: z.enum(WATCH_STATUSES).default("PLAN_TO_WATCH"),
  currentEpisode: z.number().int().min(0).default(0),
  score: z.number().int().min(1).max(10).nullable().optional(),
  isFavorite: z.boolean().default(false),
});

export const GET = withApiHandler(async () => {
  const user = await getUser();
  if (!user) {
    return apiError("Not signed in", 401, "UNAUTHENTICATED");
  }

  const supabase = createClient();
  const { data: items, error } = await supabase
    .from("user_anime")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return apiOk({ items: items || [] });
});

export const POST = withApiHandler(async (req: Request) => {
  const user = await getUser();
  if (!user) {
    return apiError("Not signed in", 401, "UNAUTHENTICATED");
  }

  const rate = await checkRateLimit(`watchlist-write:${user.id}`, 30, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const normalizedStatus = parsed.data.status === "PLANNING" ? "PLAN_TO_WATCH" : parsed.data.status;

  await ensureAnime(parsed.data.malId, parsed.data.title, parsed.data.imageUrl || "");

  const supabase = createClient();
  const { data: item, error } = await supabase
    .from("user_anime")
    .upsert(
      {
        user_id: user.id,
        mal_id: parsed.data.malId,
        title: parsed.data.title,
        image_url: parsed.data.imageUrl || null,
        total_episodes: parsed.data.totalEpisodes || null,
        status: normalizedStatus,
        current_episode: parsed.data.currentEpisode,
        score: parsed.data.score || null,
        is_favorite: parsed.data.isFavorite,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,mal_id" }
    )
    .select()
    .single();

  if (error) throw error;

  try {
    revalidatePath("/app/library");
    revalidatePath("/app/history");
    revalidatePath("/watchlist");
    revalidatePath(`/anime/${parsed.data.malId}`);
  } catch {
    // Non-critical cache revalidation catch
  }

  return apiOk({ item }, 201);
});
