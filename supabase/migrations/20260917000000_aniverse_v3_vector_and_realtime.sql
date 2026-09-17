-- ==============================================================================
-- AniVerse V3.0 — Vector Search, Realtime Watch Parties & Performance Indexing
-- ==============================================================================

-- 1. Notification Polling Optimization Index (partial index for unread alerts)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON public.notifications(user_id, read_at) 
  WHERE read_at IS NULL;

-- 2. Vector Search Integration (pgvector)
-- Enable the vector extension for semantic similarity matching
CREATE EXTENSION IF NOT EXISTS vector;

-- Add 1536-dimensional dense embedding column for OpenAI text-embedding-3-small
ALTER TABLE public.anime 
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW index for sub-second cosine distance searches
CREATE INDEX IF NOT EXISTS idx_anime_embedding 
  ON public.anime USING hnsw (embedding vector_cosine_ops);

-- RPC function for semantic retrieval with similarity scoring
CREATE OR REPLACE FUNCTION match_anime(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  mal_id int,
  title text,
  title_english text,
  synopsis text,
  score numeric,
  images jsonb,
  genres jsonb,
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
    anime.title_english,
    anime.synopsis,
    anime.score,
    anime.images,
    anime.genres,
    1 - (anime.embedding <=> query_embedding) AS similarity
  FROM public.anime
  WHERE anime.embedding IS NOT NULL
    AND 1 - (anime.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 3. Realtime Watch Parties Foundation
CREATE TABLE IF NOT EXISTS public.watch_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_mal_id INTEGER NOT NULL REFERENCES public.anime(mal_id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_code TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  current_episode INTEGER NOT NULL DEFAULT 1,
  current_seconds NUMERIC NOT NULL DEFAULT 0,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_watch_parties_anime 
  ON public.watch_parties(anime_mal_id);

CREATE INDEX IF NOT EXISTS idx_watch_parties_code 
  ON public.watch_parties(room_code);

ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Watch parties readable by authenticated"
  ON public.watch_parties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Host can insert watch party"
  ON public.watch_parties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host can update watch party"
  ON public.watch_parties FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_user_id);

CREATE POLICY "Host can delete watch party"
  ON public.watch_parties FOR DELETE
  TO authenticated
  USING (auth.uid() = host_user_id);

-- 4. External OAuth Sync Accounts (MyAnimeList / AniList two-way sync foundation)
CREATE TABLE IF NOT EXISTS public.external_oauth_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('MAL', 'ANILIST')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'IDLE' CHECK (sync_status IN ('IDLE', 'SYNCING', 'SUCCESS', 'FAILED')),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_oauth_sync_user 
  ON public.external_oauth_sync(user_id, provider);

ALTER TABLE public.external_oauth_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own OAuth sync"
  ON public.external_oauth_sync FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
