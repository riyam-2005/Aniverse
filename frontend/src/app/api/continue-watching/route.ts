import { z } from "zod";
import { apiError, apiOk, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";
import { ensureAnime } from "@/core/clients/anime.service";

const updateSchema = z.object({
  malId: z.number().int().positive(),
  title: z.string().trim().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  episodeNumber: z.number().int().positive().default(1),
  timestampSec: z.number().int().min(0).default(0),
  durationSec: z.number().int().positive().optional(),
});

export const GET = withApiHandler(async () => {
  const user = await getUser();
  if (!user) {
    return apiOk({ items: [] });
  }

  const supabase = createClient();
  const { data: items } = await supabase
    .from("user_anime")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "WATCHING")
    .order("updated_at", { ascending: false })
    .limit(12);

  return apiOk({
    items: (items || []).map((item) => ({
      id: item.id,
      malId: item.mal_id,
      title: item.title,
      imageUrl: item.image_url || "",
      episodeNumber: item.current_episode || 1,
      timestampSec: item.progress_seconds || 0,
      totalEpisodes: item.total_episodes,
      updatedAt: item.updated_at,
    })),
  });
});

export const POST = withApiHandler(async (req: Request) => {
  const user = await getUser();
  if (!user) {
    return apiError("Sign in to track continue watching progress", 401, "UNAUTHENTICATED");
  }

  const rate = await checkRateLimit(`continue-watching:${user.id}`, 60, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many progress updates.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid payload", 400, "VALIDATION_ERROR");
  }

  const { malId, title, imageUrl, episodeNumber, timestampSec, durationSec } = parsed.data;

  await ensureAnime(malId, title, imageUrl || "");

  const supabase = createClient();

  // Update current user_anime pointer
  const { data: record, error: libraryError } = await supabase
    .from("user_anime")
    .upsert(
      {
        user_id: user.id,
        mal_id: malId,
        title,
        image_url: imageUrl || null,
        status: "WATCHING",
        current_episode: episodeNumber,
        progress_seconds: timestampSec,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,mal_id" }
    )
    .select()
    .single();

  if (libraryError) throw libraryError;

  // Log to append-only watch_history
  await supabase.from("watch_history").insert({
    user_id: user.id,
    mal_id: malId,
    episode_number: episodeNumber,
    progress_seconds: timestampSec,
    duration_seconds: durationSec || null,
  });

  return apiOk({ item: record }, 200);
});
