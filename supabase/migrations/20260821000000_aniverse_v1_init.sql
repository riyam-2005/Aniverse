-- ==============================================================================
-- AniVerse V1 — Core Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Anime table (canonical local metadata cache for foreign keys and fast reads)
CREATE TABLE IF NOT EXISTS public.anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mal_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  synopsis TEXT,
  image_url TEXT,
  banner_url TEXT,
  type TEXT,
  status TEXT,
  episodes INTEGER,
  duration TEXT,
  score NUMERIC(4, 2),
  rank INTEGER,
  popularity INTEGER,
  season TEXT,
  year INTEGER,
  source TEXT,
  rating TEXT,
  last_episodes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Genres table
CREATE TABLE IF NOT EXISTS public.genres (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 4. Anime Genres join table
CREATE TABLE IF NOT EXISTS public.anime_genres (
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (anime_id, genre_id)
);

-- 5. Studios table
CREATE TABLE IF NOT EXISTS public.studios (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- 6. Anime Studios join table
CREATE TABLE IF NOT EXISTS public.anime_studios (
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  studio_id INTEGER NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  PRIMARY KEY (anime_id, studio_id)
);

-- 7. Episodes table
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT,
  air_date TIMESTAMPTZ,
  duration INTEGER,
  filler BOOLEAN DEFAULT FALSE,
  recap BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(anime_id, episode_number)
);

-- 8. User Anime Library (Primary tracking table)
CREATE TABLE IF NOT EXISTS public.user_anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES public.anime(id) ON DELETE SET NULL,
  mal_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  total_episodes INTEGER,
  status TEXT NOT NULL DEFAULT 'PLAN_TO_WATCH' CHECK (status IN ('WATCHING', 'COMPLETED', 'PLAN_TO_WATCH', 'ON_HOLD', 'DROPPED')),
  current_episode INTEGER NOT NULL DEFAULT 0,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  score INTEGER CHECK (score IS NULL OR (score >= 1 AND score <= 10)),
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mal_id)
);

-- 9. Watch History (Append-only playback log for analytics and resume fallback)
CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES public.anime(id) ON DELETE SET NULL,
  mal_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL DEFAULT 1,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES public.anime(id) ON DELETE SET NULL,
  mal_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  title TEXT,
  content TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mal_id)
);

-- 11. Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES public.anime(id) ON DELETE SET NULL,
  mal_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Comment Likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 13. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('NEW_EPISODE', 'RECOMMENDATION', 'WATCHLIST_REMINDER', 'SYSTEM', 'COMMUNITY')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. User Preferences & AI Profile
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_genres JSONB NOT NULL DEFAULT '[]'::jsonb,
  favorite_studios JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_episode_length TEXT,
  preference_vector JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Anime Follows (Airing notifications)
CREATE TABLE IF NOT EXISTS public.anime_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mal_id INTEGER NOT NULL,
  notify_episode BOOLEAN NOT NULL DEFAULT TRUE,
  notify_dub BOOLEAN NOT NULL DEFAULT TRUE,
  notify_movie BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mal_id)
);

-- 16. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_summary TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_anime_mal_id ON public.anime(mal_id);
CREATE INDEX IF NOT EXISTS idx_anime_score ON public.anime(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_anime_popularity ON public.anime(popularity ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_user_anime_user_status ON public.user_anime(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_anime_user_favorite ON public.user_anime(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_anime_mal_id ON public.user_anime(mal_id);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id, watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_history_mal_id ON public.watch_history(mal_id, watched_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_mal_id ON public.reviews(mal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_mal_id ON public.comments(mal_id, deleted_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anime_follows_mal_id ON public.anime_follows(mal_id);

-- ==============================================================================
-- AUTOMATIC PROFILE & PREFERENCES PROVISIONING TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_username TEXT;
  raw_name TEXT;
  raw_avatar TEXT;
BEGIN
  raw_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  raw_username := LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g'));
  raw_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '');

  -- Insert profile
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    raw_username || '_' || SUBSTRING(NEW.id::text FROM 1 FOR 6),
    raw_name,
    raw_avatar
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert initial preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles policies
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Anime & Metadata (Public read, admin write)
CREATE POLICY "Anime metadata is readable by everyone" ON public.anime FOR SELECT USING (true);
CREATE POLICY "Genres are readable by everyone" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Anime genres are readable by everyone" ON public.anime_genres FOR SELECT USING (true);
CREATE POLICY "Studios are readable by everyone" ON public.studios FOR SELECT USING (true);
CREATE POLICY "Anime studios are readable by everyone" ON public.anime_studios FOR SELECT USING (true);
CREATE POLICY "Episodes are readable by everyone" ON public.episodes FOR SELECT USING (true);

-- Allow authenticated users / server client to insert cached anime metadata
CREATE POLICY "Authenticated users can insert anime cache" ON public.anime FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update anime cache" ON public.anime FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. User Library (user_anime)
CREATE POLICY "Users can view their own library" ON public.user_anime
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own library" ON public.user_anime
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library" ON public.user_anime
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own library" ON public.user_anime
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Watch History
CREATE POLICY "Users can view their own watch history" ON public.watch_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own watch history" ON public.watch_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Reviews
CREATE POLICY "Reviews are readable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Comments & Likes
CREATE POLICY "Comments are readable by everyone" ON public.comments
  FOR SELECT USING (deleted_at IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Comment likes are readable by everyone" ON public.comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own comment likes" ON public.comment_likes
  FOR ALL USING (auth.uid() = user_id);

-- 7. Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. User Preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. Anime Follows
CREATE POLICY "Users can view their own anime follows" ON public.anime_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own anime follows" ON public.anime_follows
  FOR ALL USING (auth.uid() = user_id);

-- 10. Admin Logs (Admin only)
CREATE POLICY "Admins can view admin logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
  );
