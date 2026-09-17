import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { checkRateLimit } from '@/core/clients/rate-limit';
import { createClient } from '@/core/clients/supabase';
import { askAniverse } from '@/features/ai-companion/ai.service';

export const aiRoutes = Router();

const askSchema = z.object({
  prompt: z.string().trim().min(2, "Please provide a question or recommendation criteria").max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .optional(),
});

aiRoutes.post('/ask', async (req, res) => {
  try {
    // User ID would typically come from a JWT in the header in a decoupled app
    const userId = req.headers['x-user-id'] as string;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'anon';
    const rateKey = userId ? `ai-ask:${userId}` : `ai-ask:ip:${clientIp}`;

    const rate = await checkRateLimit(rateKey, 15, 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many AI requests. Please slow down.", code: "RATE_LIMITED" });
    }

    const parsed = askSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid query", code: "VALIDATION_ERROR" });
    }

    const userWatchlistMalIds = new Set<number>();
    if (userId) {
      const supabase = createClient();
      const { data: library } = await supabase
        .from("user_anime")
        .select("mal_id")
        .eq("user_id", userId);

      if (library) {
        for (const item of library) {
          userWatchlistMalIds.add(item.mal_id);
        }
      }
    }

    const result = await askAniverse(parsed.data.prompt, userWatchlistMalIds, parsed.data.history || []);
    return res.json({ ok: true, data: result });
  } catch (error: any) {
    console.error('[AI_ASK_ERROR]', error);
    return res.status(500).json({ ok: false, error: "Internal server error", code: "SERVER_ERROR" });
  }
});
