import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { checkRateLimit } from '@/core/clients/rate-limit';
import { createClient } from '@/core/clients/supabase';

export const userRoutes = Router();

const prefSchema = z.object({
  genreIds: z.array(z.number().int().positive()).max(20),
});

userRoutes.patch('/preferences', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not signed in.", code: "UNAUTHENTICATED" });
    }

    const rate = await checkRateLimit(`preferences:${userId}`, 20, 10 * 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many requests. Slow down a bit.", code: "RATE_LIMITED" });
    }

    const parsed = prefSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          favorite_genres: parsed.data.genreIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;

    return res.json({ ok: true, data: { ok: true } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});
