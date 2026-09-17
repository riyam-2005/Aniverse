import { z } from "zod";
import { revalidatePath } from "next/cache";
import { apiError, apiOk, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";

const WATCH_STATUSES = ["PLANNING", "PLAN_TO_WATCH", "WATCHING", "COMPLETED", "ON_HOLD", "DROPPED"] as const;

const updateSchema = z.object({
  status: z.enum(WATCH_STATUSES).optional(),
  progress: z.number().int().min(0).max(100000).optional(),
  current_episode: z.number().int().min(0).max(100000).optional(),
  increment_by: z.number().int().min(1).max(1000).optional(),
  score: z.number().int().min(1).max(10).nullable().optional(),
  is_favorite: z.boolean().optional(),
  rewatch_count: z.number().int().min(0).optional(),
  action: z.enum(["rewatch"]).optional(),
});

export const PATCH = withApiHandler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const user = await getUser();
    if (!user) {
      return apiError("Not signed in", 401, "UNAUTHENTICATED");
    }

    const rate = await checkRateLimit(`watchlist-write:${user.id}`, 30, 60 * 1000);
    if (!rate.ok) {
      return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
    }

    const body = await readJson(req);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
    }

    const supabase = createClient();
    const isNumericId = /^\d+$/.test(params.id);

    // Retrieve existing record if needed for relative updates (increment or rewatch)
    let existingItem: any = null;
    if (parsed.data.increment_by !== undefined || parsed.data.action === "rewatch") {
      let fetchQuery = supabase.from("user_anime").select("*").eq("user_id", user.id);
      if (isNumericId) {
        fetchQuery = fetchQuery.eq("mal_id", parseInt(params.id, 10));
      } else {
        fetchQuery = fetchQuery.eq("id", params.id);
      }
      const { data } = await fetchQuery.single();
      existingItem = data;
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.action === "rewatch" && existingItem) {
      updatePayload.rewatch_count = (existingItem.rewatch_count || 0) + 1;
      updatePayload.status = "WATCHING";
      updatePayload.current_episode = 1;
      updatePayload.completed_at = null;

      // Log rewatch start to watch history
      await supabase.from("watch_history").insert({
        user_id: user.id,
        mal_id: existingItem.mal_id,
        episode_number: 1,
        progress_seconds: 0,
      });
    } else {
      if (parsed.data.status) {
        updatePayload.status = parsed.data.status === "PLANNING" ? "PLAN_TO_WATCH" : parsed.data.status;
        if (updatePayload.status === "COMPLETED") {
          updatePayload.completed_at = new Date().toISOString();
        }
      }

      if (parsed.data.increment_by !== undefined && existingItem) {
        const cur = existingItem.current_episode || 0;
        const total = existingItem.total_episodes;
        const nextEp = total ? Math.min(total, cur + parsed.data.increment_by) : cur + parsed.data.increment_by;
        updatePayload.current_episode = nextEp;
        if (total && nextEp >= total) {
          updatePayload.status = "COMPLETED";
          updatePayload.completed_at = new Date().toISOString();
        } else if (existingItem.status === "PLAN_TO_WATCH") {
          updatePayload.status = "WATCHING";
        }
      } else if (parsed.data.current_episode !== undefined) {
        updatePayload.current_episode = parsed.data.current_episode;
      } else if (parsed.data.progress !== undefined) {
        updatePayload.current_episode = parsed.data.progress;
      }

      if (parsed.data.score !== undefined) {
        updatePayload.score = parsed.data.score;
      }
      if (parsed.data.is_favorite !== undefined) {
        updatePayload.is_favorite = parsed.data.is_favorite;
      }
      if (parsed.data.rewatch_count !== undefined) {
        updatePayload.rewatch_count = parsed.data.rewatch_count;
      }
    }

    let query = supabase.from("user_anime").update(updatePayload).eq("user_id", user.id);
    if (isNumericId) {
      query = query.eq("mal_id", parseInt(params.id, 10));
    } else {
      query = query.eq("id", params.id);
    }

    const { data: item, error } = await query.select().single();
    if (error) {
      return apiError("Record not found", 404, "NOT_FOUND");
    }

    try {
      revalidatePath("/app/library");
      revalidatePath("/app/history");
      revalidatePath("/watchlist");
      if (item.mal_id) revalidatePath(`/anime/${item.mal_id}`);
    } catch {
      // Non-critical cache revalidation catch
    }

    return apiOk({ item });
  }
);

export const DELETE = withApiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const user = await getUser();
    if (!user) {
      return apiError("Not signed in", 401, "UNAUTHENTICATED");
    }

    const supabase = createClient();
    const isNumericId = /^\d+$/.test(params.id);

    let query = supabase.from("user_anime").delete().eq("user_id", user.id);
    if (isNumericId) {
      query = query.eq("mal_id", parseInt(params.id, 10));
    } else {
      query = query.eq("id", params.id);
    }

    const { error } = await query;
    if (error) throw error;

    try {
      revalidatePath("/app/library");
      revalidatePath("/app/history");
      revalidatePath("/watchlist");
    } catch {
      // Non-critical cache revalidation catch
    }

    return apiOk({ ok: true });
  }
);
