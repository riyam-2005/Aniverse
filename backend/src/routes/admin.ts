import { Router, Request, Response } from 'express';
import { getAdminClient } from '@/core/clients/supabase-admin';
import { getAnimeById } from '@/core/clients/jikan';
import { getJikanHealth } from '@/core/clients/jikan';
import { createClient } from '@/core/clients/supabase';

export const adminRoutes = Router();

adminRoutes.get('/health', async (req, res) => {
  try {
    const startedAt = Date.now();
    const supabase = createClient();

    const [dbResult, jikan] = await Promise.allSettled([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      getJikanHealth(),
    ]);

    const db =
      dbResult.status === "fulfilled" && !dbResult.value.error
        ? { status: "ok" as const }
        : {
            status: "down" as const,
            error: dbResult.status === "rejected" ? String(dbResult.reason) : dbResult.value.error?.message,
          };

    const jikanHealth =
      jikan.status === "fulfilled"
        ? jikan.value
        : { status: "down" as const, failures: 0, circuitOpen: false, backend: "memory" as const };

    const overall =
      db.status === "ok" && jikanHealth.status !== "down" ? "ok" : "degraded";

    const processMetrics = {
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    };

    return res.json({
      ok: true,
      data: {
        status: overall,
        checks: { db, jikan: jikanHealth },
        process: processMetrics,
        responseTimeMs: Date.now() - startedAt,
        time: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

adminRoutes.get('/cron/check-episodes', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" });
    }

    const adminSupabase = getAdminClient();

    const { data: watching, error: watchError } = await adminSupabase
      .from("user_anime")
      .select("mal_id, title, image_url")
      .eq("status", "WATCHING");

    if (watchError || !watching) {
      return res.json({ ok: true, data: { checked: 0, notified: 0 } });
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

    return res.json({ ok: true, data: { checked: uniqueMalIds.length, notified } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});
