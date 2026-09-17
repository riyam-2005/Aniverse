import { createClient } from "@/core/clients/supabase-server";

/**
 * Ensures an `Anime` row exists in the Supabase `anime` table for the given MAL ID.
 * Lazily upserts basic metadata so foreign key references remain intact.
 */
export async function ensureAnime(
  malId: number,
  title: string = `Anime #${malId}`,
  imageUrl: string = ""
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("anime")
    .upsert(
      {
        mal_id: malId,
        title,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mal_id" }
    )
    .select()
    .single();

  if (error) {
    console.warn(`[anime] Failed to ensure anime mal_id=${malId}:`, error);
  }
  return data;
}
