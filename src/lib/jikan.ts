import { Redis } from "@upstash/redis";
import type {
  Anime,
  Genre,
  JikanListResponse,
  JikanSingleResponse,
  Weekday,
} from "@/types/anime";

const BASE_URL = "https://api.jikan.moe/v4";

/**
 * Shared (cross-instance) backend for the stale-cache + circuit-breaker
 * state below. On a serverless host (Vercel etc), each request can land on
 * a different instance with its own empty memory — so an in-memory-only
 * cache frequently has nothing to serve when Jikan is flaky, and the
 * circuit breaker's failure count never actually accumulates across
 * instances. Upstash Redis is already used for rate-limiting elsewhere in
 * this app, so we reuse it here when configured, falling back to the
 * original in-memory behavior otherwise (local dev, or a single-instance
 * deployment without Redis set up).
 */
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Jikan's public API is capped at ~3 req/sec. A tiny in-process queue keeps
// our server from tripping that limit when several requests fire at once
// (e.g. a page that needs both "top airing" and "top upcoming").
let queue: Promise<unknown> = Promise.resolve();
const MIN_GAP_MS = 350;

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(() =>
    fn().finally(() => new Promise((r) => setTimeout(r, MIN_GAP_MS)))
  );
  // Keep the queue chain alive even if this particular call rejects.
  queue = run.catch(() => undefined);
  return run;
}

/**
 * --- Resilience against Jikan being a single point of failure ---
 *
 * Jikan is a free, unauthenticated, third-party API with no uptime
 * guarantee. We can't eliminate that dependency without swapping to a
 * different (paid, or self-hosted) anime data source, which is a much
 * bigger change than this app needs today. What we CAN do cheaply:
 *
 *  1. Stale-while-revalidate at the app level: remember the last
 *     successful response for each path. If Jikan is down/erroring, serve
 *     that stale response instead of a broken page — a slightly outdated
 *     top-anime list beats a 500.
 *  2. A circuit breaker: once Jikan has failed several times in a row,
 *     stop hammering it with fresh requests for a cooldown window and go
 *     straight to cache (or a clear error if there's no cache yet). This
 *     keeps a Jikan outage from also making our own server slow (every
 *     request paying full retry+timeout cost).
 */

type StaleEntry = { data: unknown; storedAt: number };
const staleCache = new Map<string, StaleEntry>(); // in-memory fallback only
const STALE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // don't serve data older than this

const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 30 * 1000;

// In-memory fallback state (used only when Redis isn't configured).
let memFailures = 0;
let memCircuitOpenUntil = 0;

const CIRCUIT_KEY = "aniverse:jikan:circuit";
type CircuitState = { failures: number; openUntil: number };

async function getCircuitState(): Promise<CircuitState> {
  if (!redis) return { failures: memFailures, openUntil: memCircuitOpenUntil };
  const state = await redis.get<CircuitState>(CIRCUIT_KEY);
  return state ?? { failures: 0, openUntil: 0 };
}

async function circuitIsOpen(): Promise<boolean> {
  const { failures, openUntil } = await getCircuitState();
  return failures >= FAILURE_THRESHOLD && Date.now() < openUntil;
}

/** Exposed for /api/health so uptime monitoring can see Jikan's state,
 *  not just our own DB — a lot of "the site is broken" reports are
 *  actually "Jikan is down and the circuit is open right now". */
export async function getJikanHealth(): Promise<{
  status: "ok" | "degraded" | "down";
  failures: number;
  circuitOpen: boolean;
  backend: "redis" | "memory";
}> {
  const { failures, openUntil } = await getCircuitState();
  const circuitOpen = failures >= FAILURE_THRESHOLD && Date.now() < openUntil;
  return {
    status: circuitOpen ? "down" : failures > 0 ? "degraded" : "ok",
    failures,
    circuitOpen,
    backend: redis ? "redis" : "memory",
  };
}

async function recordSuccess(path: string, data: unknown) {
  if (redis) {
    await Promise.all([
      redis.set(CIRCUIT_KEY, { failures: 0, openUntil: 0 }),
      redis.set(staleKey(path), { data, storedAt: Date.now() }, {
        ex: STALE_MAX_AGE_MS / 1000,
      }),
    ]);
    return;
  }
  memFailures = 0;
  staleCache.set(path, { data, storedAt: Date.now() });
}

async function recordFailure() {
  if (redis) {
    const { failures } = await getCircuitState();
    const next = failures + 1;
    await redis.set(CIRCUIT_KEY, {
      failures: next,
      openUntil: next >= FAILURE_THRESHOLD ? Date.now() + COOLDOWN_MS : 0,
    });
    return;
  }
  memFailures += 1;
  if (memFailures >= FAILURE_THRESHOLD) {
    memCircuitOpenUntil = Date.now() + COOLDOWN_MS;
  }
}

function staleKey(path: string): string {
  return `aniverse:jikan:stale:${path}`;
}

async function getUsableStale<T>(path: string): Promise<T | null> {
  if (redis) {
    const entry = await redis.get<StaleEntry>(staleKey(path));
    if (!entry) return null;
    if (Date.now() - entry.storedAt > STALE_MAX_AGE_MS) return null;
    return entry.data as T;
  }
  const entry = staleCache.get(path);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > STALE_MAX_AGE_MS) return null;
  return entry.data as T;
}

// Without a timeout, a slow/hanging Jikan response ties up the request
// until the platform's own function timeout kills it — which shows up to
// the user as a generic, unhelpful "couldn't load" failure with no
// meaningful error detail and no chance for our retry/backoff or
// stale-cache fallback to kick in first. Capping each attempt keeps those
// paths in control instead.
const FETCH_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 3;
// 429 (rate limited), 5xx (upstream having issues), and network-level
// failures (DNS blip, connection reset, our own timeout) are all worth
// retrying — a bad request (4xx other than 429) never will be, so those
// fail immediately instead of wasting two more round trips.
const RETRYABLE_STATUS = (status: number) => status === 429 || status >= 500;

async function fetchOnce<T>(
  path: string,
  revalidateSeconds: number
): Promise<{ ok: true; data: T } | { ok: false; status?: number; err: unknown }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, status: res.status, err: new Error(`Jikan API error: ${res.status}`) };
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    return { ok: false, err };
  }
}

async function rawFetch<T>(path: string, revalidateSeconds: number): Promise<T> {
  let lastErr: unknown = new Error("Jikan API error: unknown failure");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await fetchOnce<T>(path, revalidateSeconds);
    if (result.ok) return result.data;

    lastErr = result.err;
    const shouldRetry =
      attempt < MAX_ATTEMPTS &&
      (result.status === undefined || RETRYABLE_STATUS(result.status));
    if (!shouldRetry) break;

    // Exponential backoff with jitter: 400-600ms, then 800-1200ms.
    const base = 400 * 2 ** (attempt - 1);
    await new Promise((r) => setTimeout(r, base + Math.random() * base * 0.5));
  }

  throw lastErr;
}

async function jikanFetch<T>(
  path: string,
  revalidateSeconds = 3600
): Promise<T> {
  if (await circuitIsOpen()) {
    const stale = await getUsableStale<T>(path);
    if (stale) return stale;
    throw new Error("Jikan API is currently unavailable (circuit open, no cached data)");
  }

  try {
    const data = await throttled(() => rawFetch<T>(path, revalidateSeconds));
    await recordSuccess(path, data);
    return data;
  } catch (err) {
    await recordFailure();
    const stale = await getUsableStale<T>(path);
    if (stale) {
      console.warn(`[jikan] live fetch failed for ${path}, serving stale cache:`, err);
      return stale;
    }
    throw err;
  }
}

export async function getTopAnime(page = 1): Promise<JikanListResponse<Anime>> {
  return jikanFetch<JikanListResponse<Anime>>(`/top/anime?page=${page}`, 1800);
}

export async function getSeasonNow(page = 1): Promise<JikanListResponse<Anime>> {
  return jikanFetch<JikanListResponse<Anime>>(`/seasons/now?page=${page}`, 1800);
}

export async function getTopAiring(page = 1): Promise<JikanListResponse<Anime>> {
  return jikanFetch<JikanListResponse<Anime>>(
    `/top/anime?filter=airing&page=${page}`,
    1800
  );
}

export async function getUpcoming(page = 1): Promise<JikanListResponse<Anime>> {
  return jikanFetch<JikanListResponse<Anime>>(
    `/seasons/upcoming?page=${page}`,
    3600
  );
}

export async function getSchedule(
  day: Weekday
): Promise<JikanListResponse<Anime>> {
  return jikanFetch<JikanListResponse<Anime>>(
    `/schedules?filter=${day}&sfw=true`,
    3600
  );
}

/**
 * Null means "this ID genuinely doesn't exist on MyAnimeList" (Jikan
 * returned a 404) — the page should render the real not-found UI.
 * Anything else (network error, circuit open, 5xx) is rethrown so the
 * page's error.tsx boundary handles it, instead of being silently
 * remapped to the same not-found page. Those are different situations
 * for the user: "no such anime" vs. "we couldn't reach the data source
 * right now, try again."
 */
// Deliberately bypasses jikanFetch's stale-cache layer: caching a "random"
// endpoint would make it return the same title repeatedly, defeating the
// point. A direct call also means genuine failures surface as null rather
// than silently serving old data.
export async function getRandomAnime(): Promise<Anime | null> {
  try {
    const res = await rawFetch<JikanSingleResponse<Anime>>("/random/anime", 0);
    return res.data;
  } catch {
    return null;
  }
}

export async function getAnimeById(id: number): Promise<Anime | null> {
  try {
    const res = await jikanFetch<JikanSingleResponse<Anime>>(
      `/anime/${id}/full`,
      3600
    );
    return res.data;
  } catch (err) {
    if (err instanceof Error && /Jikan API error: 404/.test(err.message)) {
      return null;
    }
    throw err;
  }
}

export interface SearchFilters {
  type?: string; // tv | movie | ova | special | ona | music
  status?: string; // airing | complete | upcoming
  minScore?: number;
  genres?: number[]; // Jikan genre mal_ids, comma-joined
  orderBy?: string; // popularity | score | title | start_date ...
  sort?: "asc" | "desc";
}

export async function searchAnime(
  query: string,
  page = 1,
  filters: SearchFilters = {}
): Promise<JikanListResponse<Anime>> {
  const params = new URLSearchParams({
    page: String(page),
    sfw: "true",
    order_by: filters.orderBy ?? "popularity",
    sort: filters.sort ?? "asc",
  });
  if (query.trim()) params.set("q", query.trim());
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.minScore) params.set("min_score", String(filters.minScore));
  if (filters.genres?.length) params.set("genres", filters.genres.join(","));

  return jikanFetch<JikanListResponse<Anime>>(`/anime?${params.toString()}`, 600);
}

export async function getAnimeByGenre(
  genreId: number,
  page = 1
): Promise<JikanListResponse<Anime>> {
  return jikanFetch<JikanListResponse<Anime>>(
    `/anime?genres=${genreId}&page=${page}&sfw=true&order_by=popularity&sort=asc`,
    1800
  );
}

export async function getGenres(): Promise<Genre[]> {
  const res = await jikanFetch<JikanListResponse<Genre>>(
    `/genres/anime?filter=genres`,
    86400
  );
  return res.data;
}

interface RecommendationEntry {
  entry: Anime;
  votes?: number;
}

/**
 * "Because you watched X" — Jikan's community recommendations for a title.
 * Returns a plain Anime[] (mapped from the `entry` field) so callers can
 * reuse the normal <AnimeCard>. Entries only carry mal_id/title/images, so
 * everything else on Anime stays optional/undefined, which AnimeCard
 * already handles gracefully.
 */
export async function getAnimeRecommendations(id: number): Promise<Anime[]> {
  try {
    const res = await jikanFetch<JikanListResponse<RecommendationEntry>>(
      `/anime/${id}/recommendations`,
      21600
    );
    return res.data.slice(0, 12).map((r) => r.entry);
  } catch {
    return [];
  }
}
