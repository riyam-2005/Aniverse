-- ==============================================================================
-- AniVerse V2.0 — Performance Indexing & Rewatch Optimization Migration
-- ==============================================================================

-- 1. Add rewatch_count column to user_anime table
ALTER TABLE public.user_anime 
ADD COLUMN IF NOT EXISTS rewatch_count INTEGER NOT NULL DEFAULT 0;

-- 2. Performance Composite Indexes
-- High frequency queries: library by status, user watch timeline, updated recency
CREATE INDEX IF NOT EXISTS idx_user_anime_user_status 
  ON public.user_anime(user_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_anime_user_updated 
  ON public.user_anime(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_watch_history_user_watched 
  ON public.watch_history(user_id, watched_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_anime_rewatch 
  ON public.user_anime(user_id, rewatch_count) 
  WHERE rewatch_count > 0;
