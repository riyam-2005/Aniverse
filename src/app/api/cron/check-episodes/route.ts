import { apiOk, apiError, withApiHandler } from "@/core/utils/api";
import { getAdminClient } from "@/core/clients/supabase-admin";
import { getAnimeById } from "@/core/clients/jikan";

export const GET = withApiHandler(async (req) => {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const adminSupabase = getAdminClient();

  // Get all active titles currently being watched
  const { data: watching, error: watchError } = await adminSupabase
    .from("user_anime")
    .select("mal_id, title, image_url")
    .eq("status", "WATCHING");

  if (watchError || !watching) {
    return apiOk({ checked: 0, notified: 0 });
  }

  const uniqueMalIds = Array.from(new Set(watching.map((w) => w.mal_id)));
  let notified = 0;

  for (const malId of uniqueMalIds) {
    const anime = await getAnimeById(malId);
    if (!anime?.episodes) continue;

    const { data: cached } = await adminSupabase
      .from("anime")
      .select("last_episodes, title")
      .eq("mal_id", malId)
      .single();

    if (!cached) {
      await adminSupabase.from("anime").upsert(
        {
          mal_id: malId,
          title: anime.title_english || anime.title,
          image_url: anime.images?.jpg?.image_url || null,
          last_episodes: anime.episodes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "mal_id" }
      );
      continue;
    }

    if (anime.episodes > cached.last_episodes) {
      // Find all watchers of this anime
      const { data: watchers } = await adminSupabase
        .from("user_anime")
        .select("user_id, title")
        .eq("mal_id", malId)
        .eq("status", "WATCHING");

      if (watchers) {
        for (const w of watchers) {
          await adminSupabase.from("notifications").insert({
            user_id: w.user_id,
            type: "NEW_EPISODE",
            title: "New Episode Available",
            message: `Episode ${anime.episodes} of ${w.title} is now out!`,
            data: { mal_id: malId, episode: anime.episodes },
          });
          notified++;
        }
      }

      await adminSupabase
        .from("anime")
        .update({
          last_episodes: anime.episodes,
          updated_at: new Date().toISOString(),
        })
        .eq("mal_id", malId);
    }
  }

  return apiOk({ checked: uniqueMalIds.length, notified });
});
