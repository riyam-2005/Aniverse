import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { checkRateLimit } from '@/core/clients/rate-limit';
import { createClient } from '@/core/clients/supabase';

export const notificationRoutes = Router();

const readSchema = z.object({
  id: z.string().optional(),
});

notificationRoutes.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not signed in.", code: "UNAUTHENTICATED" });
    }

    const supabase = createClient();

    const [notifsRes, countRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null),
    ]);

    const notifications = (notifsRes.data || []).map((n) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: Boolean(n.read_at),
      createdAt: n.created_at,
      data: n.data,
    }));

    return res.json({
      ok: true,
      data: {
        notifications,
        unreadCount: countRes.count || 0,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

notificationRoutes.patch('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not signed in.", code: "UNAUTHENTICATED" });
    }

    const rate = await checkRateLimit(`notifications-read:${userId}`, 60, 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many requests. Slow down a bit.", code: "RATE_LIMITED" });
    }

    const parsed = readSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" });
    }

    const supabase = createClient();
    let query = supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (parsed.data.id) {
      query = query.eq("id", parsed.data.id);
    }

    const { error } = await query;
    if (error) throw error;

    return res.json({ ok: true, data: { ok: true } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

notificationRoutes.post('/read-all', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not signed in.", code: "UNAUTHENTICATED" });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) throw error;

    return res.json({ ok: true, data: { ok: true } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

notificationRoutes.get('/stream', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).send("Not signed in.");
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const supabase = createClient();
  let lastSignature = "";

  const tick = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .is("read_at", null),
      ]);

      const notifications = (notifsRes.data || []).map((n) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: Boolean(n.read_at),
        createdAt: n.created_at,
        data: n.data,
      }));
      const unreadCount = countRes.count || 0;

      const signature = JSON.stringify({ ids: notifications.map((n) => n.id), unreadCount });
      if (signature !== lastSignature) {
        lastSignature = signature;
        res.write(`event: notifications\ndata: ${JSON.stringify({ notifications, unreadCount })}\n\n`);
      } else {
        res.write(": ping\n\n");
      }
    } catch (err) {
      console.error('[notifications/stream] tick failed:', err);
    }
  };

  const interval = setInterval(tick, 5000);
  tick();

  req.on('close', () => {
    clearInterval(interval);
  });
});
