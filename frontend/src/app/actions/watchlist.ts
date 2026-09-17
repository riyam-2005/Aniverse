"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { createClient } from "@/core/clients/supabase-server";

/**
 * Server Action: updateEpisodeProgress
 * Performs atomic dual-write progress tracking on user_anime and watch_history,
 * followed by targeted Next.js cache purges.
 */
export async function updateEpisodeProgress(malId: number, episodeNumber: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Dual-write update to user_anime
  const { error: userAnimeError } = await supabase
    .from("user_anime")
    .update({ episodes_watched: episodeNumber, updated_at: new Date().toISOString() })
    .match({ user_id: user.id, mal_id: malId });

  if (userAnimeError) throw userAnimeError;

  // Dual-write append to watch_history
  await supabase.from("watch_history").insert({
    user_id: user.id,
    mal_id: malId,
    episode_number: episodeNumber,
    watched_at: new Date().toISOString(),
  });

  // Targeted cache purges
  try {
    revalidateTag(`user-watchlist-${user.id}`);
    revalidatePath("/library");
    revalidatePath("/history");
  } catch (err) {
    console.warn("[actions/watchlist] cache revalidation error:", err);
  }

  return { success: true };
}
