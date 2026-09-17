-- ==============================================================================
-- AniVerse V4.0 — Synopsis Vector Search & Performance Index Alignment
-- ==============================================================================

-- 1. Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add synopsis_embedding vector(1536) column on public.anime
ALTER TABLE public.anime 
  ADD COLUMN IF NOT EXISTS synopsis_embedding vector(1536);

-- HNSW index for high-speed cosine similarity on plot synopses
CREATE INDEX IF NOT EXISTS idx_anime_synopsis_embedding 
  ON public.anime USING hnsw (synopsis_embedding vector_cosine_ops);

-- Similarity Query Function specifically targeting synopsis embeddings
CREATE OR REPLACE FUNCTION match_anime_synopsis(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  mal_id int,
  title text,
  synopsis text,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    anime.mal_id,
    anime.title,
    anime.synopsis,
    1 - (anime.synopsis_embedding <=> query_embedding) AS similarity
  FROM public.anime
  WHERE anime.synopsis_embedding IS NOT NULL
    AND 1 - (anime.synopsis_embedding <=> query_embedding) > match_threshold
  ORDER BY anime.synopsis_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 3. Composite Indexing Strategy for V2.1 / V4
-- Optimize user watch library status filtering
CREATE INDEX IF NOT EXISTS idx_user_anime_user_status 
  ON public.user_anime(user_id, status);

-- Optimize watch history timeline ordering
CREATE INDEX IF NOT EXISTS idx_watch_history_user_watched 
  ON public.watch_history(user_id, watched_at DESC);

-- Optimize unread notification polling queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, created_at DESC) 
  WHERE read_at IS NULL;
