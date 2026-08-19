# Deploying AniVerse to get a live URL

This app is ready to deploy. I can't click the deploy button for you (that
requires your own hosting account), but here's the exact path — about
15 minutes, all free tiers.

## 1. Put the code on GitHub

```bash
cd aniverse-next
git init
git add .
git commit -m "AniVerse"
```
Create a new empty repo on GitHub, then:
```bash
git remote add origin https://github.com/<you>/aniverse.git
git push -u origin main
```

## 2. Get a free production database (Postgres)

SQLite (the local dev default) doesn't work on serverless hosts like Vercel —
the filesystem is wiped between requests. Switch to a real Postgres instance,
free tier is plenty for this app:

- **[Neon](https://neon.tech)** (recommended) or **[Supabase](https://supabase.com)**
- Create a project, copy the connection string it gives you (looks like
  `postgresql://user:pass@host/dbname?sslmode=require`)

You do **not** need to hand-edit `prisma/schema.prisma` for this. That file
stays `provider = "sqlite"` as the single source of truth for local dev;
`npm run build:postgres` (instead of the default `npm run build`) derives a
Postgres-flavored schema from it automatically via
`scripts/generate-postgres-schema.mjs` — the same script the CI Postgres
smoke test already uses — and builds against that. Set your Vercel project's
**Build Command** to:
```
npm run build:postgres
```
This removes the easiest step to forget in a manual swap: if you build with
plain `npm run build` against a Postgres `DATABASE_URL`, Prisma will
complain the connection string doesn't match the `sqlite` provider it was
generated for — a clear enough error, but one this avoids entirely.

## 3. Deploy to Vercel

- Go to [vercel.com/new](https://vercel.com/new), import your GitHub repo
- Framework preset: Next.js (auto-detected)
- Add these environment variables in the Vercel project settings:

| Key | Value |
|---|---|
| `DATABASE_URL` | your Neon/Supabase connection string |
| `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
| `NEXTAUTH_URL` | your Vercel URL, e.g. `https://aniverse.vercel.app` |
| `GOOGLE_CLIENT_ID` | (optional) |
| `GOOGLE_CLIENT_SECRET` | (optional) |

- Deploy.

## 4. Push the database schema

Once `DATABASE_URL` points at your real Postgres instance, run this once
from your local machine (with `.env` pointed at the same prod database) to
create the tables:
```bash
npm run db:push:postgres
```
(Not plain `prisma db push` — that would use the sqlite-provider schema.
`db:push:postgres` generates and pushes the Postgres variant, the same way
`build:postgres` does.)

## 5. Verify

Visit `https://<your-app>.vercel.app/api/health` — it should return
`{"status":"ok","db":"connected",...}`. If it doesn't, double check
`DATABASE_URL` in Vercel's environment variables.

## 6. (Recommended on Vercel) Add shared rate limiting

`src/lib/rate-limit.ts` uses an in-memory counter by default, which is
correct on a single-instance host (Railway, Render, Fly.io, a VPS) but only
*approximate* on Vercel, since each serverless invocation can land on a
different instance with its own memory.

To make limits exact across instances, create a free [Upstash Redis](https://upstash.com)
database and add these two environment variables in Vercel:

| Key | Value |
|---|---|
| `UPSTASH_REDIS_REST_URL` | from the Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | from the Upstash dashboard |

`checkRateLimit` detects these automatically and switches to the shared
Redis-backed limiter — no route code changes needed. Leave them unset and
the app falls back to the in-memory limiter with no other changes required.

## 7. Verify the Postgres migration path before you deploy

`npm run db:test:postgres` spins up a disposable local Postgres via Docker,
pushes the schema to it, and runs a smoke test that checks the things most
likely to break in a SQLite → Postgres swap: the `WatchStatus` enum column,
the `@@unique([userId, malId])` constraint, and `onDelete: Cascade`. Run it
once before your first Postgres deploy:

```bash
npm run db:test:postgres
```

Requires Docker running locally. It's disposable — nothing persists between
runs, so it's also safe to run in CI on every PR that touches
`prisma/schema.prisma`.

## Alternative: self-hosted with Docker

Steps 1–7 above assume Vercel. If you'd rather run this on Railway, Render,
Fly.io, a VPS, or your own machine, `Dockerfile` and `docker-compose.yml`
do the same job without depending on any one platform.

```bash
cp .env.example .env
```
Fill in real values for at least `POSTGRES_PASSWORD` and `NEXTAUTH_SECRET`
(`openssl rand -base64 32` for the latter) — `docker compose` refuses to
start without them rather than silently booting with placeholders.

```bash
docker compose up -d --build
```

This builds the app image (using the same Postgres-flavored build path as
`npm run build:postgres` — see step 2 above for why that matters) and
starts it alongside a Postgres container with a real persistent volume,
not the throwaway one `docker-compose.test.yml` uses for CI.

First run only, once both containers report healthy:
```bash
docker compose exec app npx prisma db push --schema=prisma/schema.prisma
```

Then visit `http://localhost:3000/api/health` — same check as step 5,
should return `{"status":"ok","db":"connected",...}`.

The container image is built from `.next/standalone` (see `output:
"standalone"` in `next.config.mjs`), so it ships without `node_modules` —
noticeably smaller and faster to pull than a naive `npm install` image.

Everything from step 6 onward (Upstash Redis for rate limiting, `CRON_SECRET`
for the notifications cron) works the same way here — set them in `.env`
and `docker-compose.yml` passes them through. One difference worth knowing:
Vercel's Cron Jobs feature (used for `/api/cron/check-episodes`) is
Vercel-specific — on a self-hosted deploy, trigger that route yourself on a
schedule instead, e.g. a host-level cron entry or CI scheduled job:
```
0 */6 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/check-episodes
```

## Notes on this build

- **Rate limiting**: in-memory by default, upgrades automatically to a
  shared Upstash-Redis-backed limiter if `UPSTASH_REDIS_REST_URL` /
  `UPSTASH_REDIS_REST_TOKEN` are set. See step 6.
- **SQLite → Postgres**: `npm run build:postgres` / `npm run db:push:postgres`
  (step 2 and 4) derive a Postgres-flavored schema from `schema.prisma`
  automatically — no manual file edit, so it can't be forgotten or drift out
  of sync. `npm run db:test:postgres` (step 7) actually exercises that
  generated schema against real Postgres instead of just asserting the swap
  "should" work.
- **Jikan (the anime data API)** is free, third-party, and unauthenticated —
  it can and does have outages. `src/lib/jikan.ts` mitigates this with a
  stale-while-revalidate cache (serves the last good response instead of an
  error page during an outage) and a circuit breaker (stops hammering a
  failing API and fails fast to cache instead). This reduces the blast
  radius of a Jikan outage but doesn't eliminate the dependency — there's
  no equivalent free drop-in alternative to fail over to. If Jikan is down
  *and* a given path has never been fetched before, that page will still
  error.
- **Security headers**, input validation, and structured error handling are
  already wired in (see `next.config.mjs` and `src/lib/api.ts`).
- `/api/health` is there for uptime monitors and to confirm the DB is
  reachable after deploying.
- **Automated tests**: `npm test` runs the Vitest suite covering the rate
  limiter, the API error-mapping helpers, and the Jikan client's retry/
  stale-cache/circuit-breaker behavior (fetch is mocked, no live calls).
- **CI**: `.github/workflows/ci.yml` runs on every push/PR to `main` — lint,
  typecheck, and unit tests in one job, plus a second job that spins up a
  real Postgres service container and runs the same schema smoke test as
  `npm run db:test:postgres`. First-time setup: run `npm install` locally
  once and commit the resulting `package-lock.json` so CI can switch from
  `npm install` to the faster, reproducible `npm ci`.
