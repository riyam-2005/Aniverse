# AniVerse — Next.js Edition

A full-stack rebuild of AniVerse: an anime discovery, broadcast-schedule, and
watchlist-tracking site. Built with the Next.js App Router, TypeScript,
Tailwind, Prisma, and NextAuth. Anime data comes live from the public
[Jikan API](https://jikan.moe) (MyAnimeList) — nothing is hardcoded.

This app does not host or stream video. Every title links out to its
official platform (Crunchyroll, Netflix, Hulu, Prime Video, HIDIVE), the
same as the original site.

## What changed from the original

The original was static HTML/CSS/JS using Supabase for auth + a
`localStorage` fallback. This version is a proper full-stack app:

- **Next.js App Router** — server components fetch anime data at request
  time (with caching), so pages are fast and always current.
- **NextAuth (Credentials provider)** — email/password accounts, hashed
  with bcrypt, stored in your own database. Google sign-in is wired up too
  and turns on automatically if you add Google OAuth credentials to `.env`.
- **Prisma + SQLite** — a real relational database for users and
  watchlists, zero config to run locally (no external service to sign up
  for). Swap the `DATABASE_URL` for Postgres/MySQL later without touching
  application code.
- **API routes** for registration and watchlist CRUD, all authorization
  checked server-side against the signed-in session.
- **New visual design** — a "broadcast console" theme: a live EPG-style
  ticker of what's airing today sits at the top of the homepage, tying the
  whole look back to the schedule feature.

## CI

Every push and PR to `main` runs, via GitHub Actions
(`.github/workflows/ci.yml`), across three jobs:
- lint + typecheck + the Vitest unit suite (`npm test`)
- a real Postgres schema check: pushes the schema to a disposable Postgres
  service container and verifies the `WatchStatus` enum column, the
  `@@unique([userId, malId])` constraint, and cascade deletes actually work
  — not just SQLite
- an E2E suite (Playwright) that runs the real app against a real SQLite DB
  and exercises register → session persistence across sign-out/sign-in →
  add to watchlist → see it listed. It deliberately does NOT depend on the
  live Jikan API for this — see the comment at the top of
  `e2e/register-login-watchlist.spec.ts` for why.
- automated accessibility checks (`e2e/accessibility.spec.ts`, axe-core via
  `@axe-core/playwright`) against the auth/legal/404 pages, checked against
  WCAG 2.0/2.1 A+AA rules. Scoped to Jikan-independent pages for the same
  reason as above — same idea, applied to a11y instead of functional flow.

Run any of these locally:
```bash
npm test               # unit tests (Vitest)
npm run test:e2e        # E2E (Playwright) — starts its own dev server + DB
npm run test:e2e:ui     # same, with Playwright's interactive UI
npm run db:test:postgres  # Postgres schema check (needs Docker)
```

## Getting started

```bash
npm install
cp .env.example .env
# open .env and set NEXTAUTH_SECRET to a random string:
#   openssl rand -base64 32

npx prisma db push   # creates dev.db (SQLite) with the schema
npm run dev
```

Visit `http://localhost:3000`.

### Optional: Google sign-in

Leave `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` blank to use email/password
only. To enable Google, create OAuth credentials in the
[Google Cloud Console](https://console.cloud.google.com/apis/credentials)
with redirect URI `http://localhost:3000/api/auth/callback/google`, then
paste the client ID/secret into `.env`.

### Moving off SQLite later

Change `datasource db { provider = "sqlite" ... }` in
`prisma/schema.prisma` to `"postgresql"` (or `"mysql"`), point
`DATABASE_URL` at your real database, and re-run `npx prisma db push`.
Nothing else in the app needs to change.

## Project structure

```
prisma/schema.prisma        # User + WatchlistItem models
src/lib/jikan.ts            # Jikan API client (throttled + cached)
src/lib/auth.ts             # NextAuth config
src/lib/prisma.ts           # Prisma client singleton
src/app/                    # Pages (App Router) + API routes
src/components/             # UI components
```

## Pages

- `/` — homepage: today's broadcast ticker, this season, trending, top rated
- `/trending` — tabbed rankings (trending / top rated / season / upcoming)
- `/schedule` — full weekly broadcast guide by day
- `/genres` — browse by genre
- `/search?q=` — title search
- `/anime/[id]` — details, trailer, genres, legal streaming links, add to watchlist
- `/watchlist` — signed-in user's tracked anime, grouped by status
- `/login`, `/register` — auth
- `/admin/analytics`, `/admin/monitoring` — internal dashboards. Access is
  granted via `User.role = "ADMIN"` in the database; `ADMIN_EMAILS` (a
  comma-separated env allowlist) is an OR on top of that, meant only to
  bootstrap the very first admin before any DB role exists. To promote a
  user once you have DB access:
  `UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';`
  (or the same via `npx prisma studio`).

## Production hardening in this build

- **Validation everywhere**: every API route validates input with Zod
  (including password complexity on registration) before touching the DB.
- **Consistent error handling**: `src/lib/api.ts` wraps every route so
  thrown errors, Zod failures, and known Prisma errors (duplicate records,
  not-found) all return clean, predictable JSON — never a raw stack trace.
- **Rate limiting**: login, registration, and watchlist writes are
  throttled per IP/user (`src/lib/rate-limit.ts`) to blunt brute-force and
  scripted abuse.
- **Security headers**: `next.config.mjs` sets `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and
  HSTS on every response.
- **Startup env validation**: `src/instrumentation.ts` checks required
  env vars (and secret strength) once at boot and fails fast in production
  instead of misbehaving silently.
- **`/api/health`**: a lightweight endpoint (checks DB connectivity, the
  Jikan circuit-breaker state, and process uptime/memory) for uptime
  monitors, post-deploy verification, and the `/admin/monitoring` dashboard.
- **Structured error logging**: `src/instrumentation.ts` also hooks
  Next's `onRequestError`, so any unhandled server-side error is logged as
  one-line JSON — searchable in whatever log viewer your host provides,
  and a straightforward place to wire a real APM (Sentry, Datadog, etc.)
  later.
- **Real-time notifications**: `/api/notifications/stream` pushes updates
  over Server-Sent Events instead of the client polling on a timer;
  `NotificationBell` falls back to polling automatically if SSE can't
  establish.

See `DEPLOYMENT.md` for how to put this live (Vercel + a free Postgres DB).

## Notes on the Jikan API

Jikan is a free, unauthenticated API with a soft rate limit (~3 req/s). The
client in `src/lib/jikan.ts` queues requests and backs off on `429`s, and
Next.js caches responses (`revalidate`) so repeat visits don't re-hit the
API. No API key is required or supported.
