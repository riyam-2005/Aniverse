import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { checkRateLimit } from '@/core/clients/rate-limit';
import { createClient } from '@/core/clients/supabase';
import { ensureAnime } from '@/core/clients/anime.service';

export const watchlistRoutes = Router();

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

const continueUpdateSchema = z.object({
  malId: z.number().int().positive(),
  title: z.string().trim().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  episodeNumber: z.number().int().positive().default(1),
  timestampSec: z.number().int().min(0).default(0),
  durationSec: z.number().int().positive().optional(),
});

// --- General Watchlist ---
watchlistRoutes.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not signed in", code: "UNAUTHENTICATED" });
    }

    const supabase = createClient();
    const { data: items, error } = await supabase
      .from("user_anime")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return res.json({ ok: true, data: { items: items || [] } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

watchlistRoutes.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not signed in", code: "UNAUTHENTICATED" });
    }

    const rate = await checkRateLimit(`watchlist-write:${userId}`, 30, 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many requests. Slow down a bit.", code: "RATE_LIMITED" });
    }

    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" });
    }

    const normalizedStatus = parsed.data.status === "PLANNING" ? "PLAN_TO_WATCH" : parsed.data.status;
    await ensureAnime(parsed.data.malId, parsed.data.title, parsed.data.imageUrl || "");

    const supabase = createClient();
    const { data: item, error } = await supabase
      .from("user_anime")
      .upsert(
        {
          user_id: userId,
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
    return res.status(201).json({ ok: true, data: { item } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

watchlistRoutes.patch('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not signed in", code: "UNAUTHENTICATED" });
    }

    const rate = await checkRateLimit(`watchlist-write:${userId}`, 30, 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many requests. Slow down a bit.", code: "RATE_LIMITED" });
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" });
    }

    const supabase = createClient();
    const isNumericId = /^\d+$/.test(req.params.id);

    let existingItem: any = null;
    if (parsed.data.increment_by !== undefined || parsed.data.action === "rewatch") {
      let fetchQuery = supabase.from("user_anime").select("*").eq("user_id", userId);
      if (isNumericId) {
        fetchQuery = fetchQuery.eq("mal_id", parseInt(req.params.id, 10));
      } else {
        fetchQuery = fetchQuery.eq("id", req.params.id);
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

      await supabase.from("watch_history").insert({
        user_id: userId,
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

    let query = supabase.from("user_anime").update(updatePayload).eq("user_id", userId);
    if (isNumericId) {
      query = query.eq("mal_id", parseInt(req.params.id, 10));
    } else {
      query = query.eq("id", req.params.id);
    }

    const { data: item, error } = await query.select().single();
    if (error) {
      return res.status(404).json({ ok: false, error: "Record not found", code: "NOT_FOUND" });
    }

    return res.json({ ok: true, data: { item } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

watchlistRoutes.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not signed in", code: "UNAUTHENTICATED" });
    }

    const supabase = createClient();
    const isNumericId = /^\d+$/.test(req.params.id);

    let query = supabase.from("user_anime").delete().eq("user_id", userId);
    if (isNumericId) {
      query = query.eq("mal_id", parseInt(req.params.id, 10));
    } else {
      query = query.eq("id", req.params.id);
    }

    const { error } = await query;
    if (error) throw error;

    return res.json({ ok: true, data: { ok: true } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

// --- Continue Watching ---
watchlistRoutes.get('/continue', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.json({ ok: true, data: { items: [] } });
    }

    const supabase = createClient();
    const { data: items } = await supabase
      .from("user_anime")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "WATCHING")
      .order("updated_at", { ascending: false })
      .limit(12);

    return res.json({
      ok: true,
      data: {
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
      }
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

watchlistRoutes.post('/continue', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Sign in to track continue watching progress", code: "UNAUTHENTICATED" });
    }

    const rate = await checkRateLimit(`continue-watching:${userId}`, 60, 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many progress updates.", code: "RATE_LIMITED" });
    }

    const parsed = continueUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload", code: "VALIDATION_ERROR" });
    }

    const { malId, title, imageUrl, episodeNumber, timestampSec, durationSec } = parsed.data;
    await ensureAnime(malId, title, imageUrl || "");

    const supabase = createClient();
    const { data: record, error: libraryError } = await supabase
      .from("user_anime")
      .upsert(
        {
          user_id: userId,
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

    await supabase.from("watch_history").insert({
      user_id: userId,
      mal_id: malId,
      episode_number: episodeNumber,
      progress_seconds: timestampSec,
      duration_seconds: durationSec || null,
    });

    return res.json({ ok: true, data: { item: record } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});
