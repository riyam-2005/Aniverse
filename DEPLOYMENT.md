# Deploying AniVerse V1 — Production Guide

AniVerse is built with **Next.js 14 App Router**, **Supabase (PostgreSQL, Auth, RLS)**, and **OpenAI (gpt-4o-mini)**.

---

## 1. Setup Supabase Project

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/20260821000000_aniverse_v1_init.sql` and run the entire SQL script.
   - This creates all 16 tables, composite keys, automatic user creation trigger (`handle_new_user`), and Row Level Security (RLS) policies.
4. Go to **Project Settings > API** and copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon / public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`)

---

## 2. Deploy on Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Aniverse V1"
   git push origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo.
3. Configure Environment Variables in Vercel:

| Key | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | `eyJhb...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhb...` |
| `OPENAI_API_KEY` | OpenAI API Key for AI features | `sk-...` |
| `NEXT_PUBLIC_APP_URL` | Production Domain | `https://aniverse.vercel.app` |
| `ADMIN_EMAILS` | Comma-separated admin emails | `admin@example.com` |
| `CRON_SECRET` | Secret for episode notifications | `openssl rand -hex 32` |
| `UPSTASH_REDIS_REST_URL` | (Optional) Upstash Redis URL | `https://...` |
| `UPSTASH_REDIS_REST_TOKEN` | (Optional) Upstash Redis Token | `...` |

4. Click **Deploy**.

---

## 3. Verify Deployment

1. Check health endpoint:
   ```
   https://<your-app>.vercel.app/api/health
   ```
   Should return `{"status": "ok", "checks": {"db": {"status": "ok"}, "jikan": {"status": "ok"}}}`.
2. Sign up with email/password or Google OAuth.
3. Test **Ask Aniverse AI** at `/ask`.
4. Test **Anime DNA** at `/app/anime-dna`.
5. Test **Personal Library** at `/app/library`.

---

## 4. Self-Hosted (Docker)

To run with Docker:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
docker compose up -d --build
```
