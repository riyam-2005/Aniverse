import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { checkRateLimit } from '@/core/clients/rate-limit';
import { createClient } from '@/core/clients/supabase';
import { ensureAnime } from '@/core/clients/anime.service';
import { semanticSearchAnime } from '@/core/clients/vector-search';

export const animeRoutes = Router();

// --- Comments ---
const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment can't be empty").max(1000, "Comment is too long (max 1000 characters)"),
});

animeRoutes.get('/:id/comments', async (req, res) => {
  try {
    const animeMalId = Number(req.params.id);
    if (!Number.isFinite(animeMalId)) {
      return res.status(400).json({ ok: false, error: "Invalid anime id", code: "VALIDATION_ERROR" });
    }

    const userId = req.headers['x-user-id'] as string;
    const supabase = createClient();

    const { data: comments, error } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id, like_count, profiles(id, username, display_name, avatar_url)")
      .eq("mal_id", animeMalId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    let myLikedCommentIds = new Set<string>();
    if (userId) {
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", userId);
      if (likes) {
        myLikedCommentIds = new Set(likes.map((l) => l.comment_id));
      }
    }

    return res.json({
      ok: true,
      data: {
        comments: (comments || []).map((c: any) => ({
          id: c.id,
          content: c.content,
          createdAt: c.created_at,
          user: {
            id: c.user_id,
            name: c.profiles?.display_name || c.profiles?.username || "Anime Fan",
            avatarUrl: c.profiles?.avatar_url,
          },
          likeCount: c.like_count || 0,
          likedByMe: myLikedCommentIds.has(c.id),
        })),
      }
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

animeRoutes.post('/:id/comments', async (req, res) => {
  try {
    const animeMalId = Number(req.params.id);
    if (!Number.isFinite(animeMalId)) {
      return res.status(400).json({ ok: false, error: "Invalid anime id", code: "VALIDATION_ERROR" });
    }

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "You need to sign in to comment.", code: "UNAUTHENTICATED" });
    }

    const rate = await checkRateLimit(`comment:${userId}`, 10, 10 * 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "You're commenting too fast. Please slow down.", code: "RATE_LIMITED" });
    }

    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" });
    }

    await ensureAnime(animeMalId);

    const supabase = createClient();
    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        mal_id: animeMalId,
        user_id: userId,
        content: parsed.data.content,
      })
      .select("*, profiles(id, username, display_name, avatar_url)")
      .single();

    if (error) throw error;

    return res.status(201).json({
      ok: true,
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        user: {
          id: userId,
          name: (comment as any).profiles?.display_name || (comment as any).profiles?.username || "You",
        },
        likeCount: 0,
        likedByMe: false,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

// --- Reviews ---
const upsertReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 10").max(10, "Rating must be between 1 and 10"),
  title: z.string().trim().max(100).optional(),
  content: z.string().trim().max(2000, "Review is too long (max 2000 characters)").optional(),
  body: z.string().trim().max(2000).optional(),
});

animeRoutes.get('/:id/reviews', async (req, res) => {
  try {
    const animeMalId = Number(req.params.id);
    if (!Number.isFinite(animeMalId)) {
      return res.status(400).json({ ok: false, error: "Invalid anime id", code: "VALIDATION_ERROR" });
    }

    const supabase = createClient();
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, mal_id, rating, title, content, created_at, updated_at, user_id, profiles(id, username, display_name, avatar_url)")
      .eq("mal_id", animeMalId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const list = reviews || [];
    const ratings = list.map((r) => r.rating);
    const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    return res.json({
      ok: true,
      data: {
        reviews: list.map((r: any) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.content,
          content: r.content,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          user: {
            id: r.user_id,
            name: r.profiles?.display_name || r.profiles?.username || "Anime Fan",
            avatarUrl: r.profiles?.avatar_url,
          },
        })),
        average,
        count: list.length,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

animeRoutes.post('/:id/reviews', async (req, res) => {
  try {
    const animeMalId = Number(req.params.id);
    if (!Number.isFinite(animeMalId)) {
      return res.status(400).json({ ok: false, error: "Invalid anime id", code: "VALIDATION_ERROR" });
    }

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "You need to sign in to leave a review.", code: "UNAUTHENTICATED" });
    }

    const rate = await checkRateLimit(`review:${userId}`, 20, 10 * 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "You're doing that too fast. Please slow down.", code: "RATE_LIMITED" });
    }

    const parsed = upsertReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" });
    }

    await ensureAnime(animeMalId);

    const supabase = createClient();
    const reviewContent = parsed.data.content || parsed.data.body || null;

    const { data: review, error } = await supabase
      .from("reviews")
      .upsert(
        {
          user_id: userId,
          mal_id: animeMalId,
          rating: parsed.data.rating,
          title: parsed.data.title || null,
          content: reviewContent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,mal_id" }
      )
      .select("*, profiles(id, username, display_name, avatar_url)")
      .single();

    if (error) throw error;

    return res.status(201).json({
      ok: true,
      data: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        body: review.content,
        content: review.content,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        user: {
          id: userId,
          name: (review as any).profiles?.display_name || (review as any).profiles?.username || "You",
        },
      }
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

animeRoutes.delete('/:id/reviews', async (req, res) => {
  try {
    const animeMalId = Number(req.params.id);
    if (!Number.isFinite(animeMalId)) {
      return res.status(400).json({ ok: false, error: "Invalid anime id", code: "VALIDATION_ERROR" });
    }

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not signed in", code: "UNAUTHENTICATED" });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("user_id", userId)
      .eq("mal_id", animeMalId);

    if (error) throw error;

    return res.json({ ok: true, data: { ok: true } });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});

// --- Semantic Search ---
const searchSchema = z.object({
  q: z.string().trim().min(2, "Query must be at least 2 characters").max(250, "Query is too long"),
  limit: z.coerce.number().int().min(1).max(25).default(10),
  threshold: z.coerce.number().min(0).max(1).default(0.4),
});

animeRoutes.get('/semantic-search', async (req, res) => {
  try {
    const parsed = searchSchema.safeParse({
      q: req.query.q,
      limit: req.query.limit,
      threshold: req.query.threshold,
    });

    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid search parameters", code: "VALIDATION_ERROR" });
    }

    const { q, limit, threshold } = parsed.data;

    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const rate = await checkRateLimit(`semantic-search:${clientIp}`, 30, 60 * 1000);
    if (!rate.ok) {
      return res.status(429).json({ ok: false, error: "Too many search requests. Please slow down.", code: "RATE_LIMITED" });
    }

    const results = await semanticSearchAnime(q, { limit, threshold });

    return res.json({
      ok: true,
      data: {
        query: q,
        count: results.length,
        results,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error.message, code: "SERVER_ERROR" });
  }
});
