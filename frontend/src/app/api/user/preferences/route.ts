import { z } from "zod";
import { apiOk, apiError, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";

const schema = z.object({
  genreIds: z.array(z.number().int().positive()).max(20),
});

export const PATCH = withApiHandler(async (req) => {
  const user = await getUser();
  if (!user) return apiError("Not signed in.", 401);

  const rate = await checkRateLimit(`preferences:${user.id}`, 20, 10 * 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        favorite_genres: parsed.data.genreIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;

  return apiOk({ ok: true });
});
