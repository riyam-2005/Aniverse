import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

/**
 * Standard error shape for every API response in the app:
 *   { error: "human readable message", code?: "MACHINE_CODE" }
 */
export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export function apiOk<T extends object>(
  data: T,
  status = 200,
  cache?: { maxAge: number; swr?: number; scope?: "public" | "private" }
) {
  const res = NextResponse.json(data, { status });
  if (cache) {
    const scope = cache.scope ?? "public";
    const swr = cache.swr ?? cache.maxAge * 4;
    // `scope: "private"` for anything personalized per-viewer (e.g. a
    // "did I like this" flag) — browser-cacheable only, never a shared
    // CDN/proxy cache, so one user's response can't be served to another.
    res.headers.set(
      "Cache-Control",
      `${scope}, max-age=${cache.maxAge}, stale-while-revalidate=${swr}`
    );
  }
  return res;
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * The set of origins this app is actually served from. NEXTAUTH_URL is
 * the canonical production/staging URL; localhost is always included so
 * local dev isn't broken by this check.
 */
function trustedOrigins(): string[] {
  const urls = [process.env.NEXTAUTH_URL, "http://localhost:3000"].filter(
    (u): u is string => Boolean(u)
  );
  return urls.map((u) => {
    try {
      return new URL(u).origin;
    } catch {
      return u;
    }
  });
}

/**
 * Defense-in-depth CSRF check: the session cookie is already SameSite=Lax
 * (NextAuth's default), which blocks the classic cross-site <form> POST
 * attack on its own — Lax cookies aren't attached to cross-site POSTs at
 * all. This adds a second, independent layer by checking the browser's
 * Origin header against the app's own origin, so a mutation still gets
 * rejected even if a proxy/CDN strips or rewrites cookie attributes
 * somewhere between the browser and this server.
 *
 * Deliberately permissive when Origin is absent rather than rejecting:
 * some legitimate same-origin requests (older clients, certain proxies,
 * server-to-server calls with their own auth) don't send it, and this is
 * a second layer on top of SameSite cookies — not the only one — so
 * failing open here doesn't remove the underlying protection.
 */
function originIsTrusted(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return trustedOrigins().includes(new URL(origin).origin);
  } catch {
    return false;
  }
}

/**
 * Wraps a route handler so that:
 *  - cross-origin state-changing requests are rejected (see originIsTrusted)
 *  - thrown errors never leak stack traces / internals to the client
 *  - Zod validation errors become clean 400s
 *  - known Prisma errors (unique constraint, not found, etc.) become
 *    sensible status codes instead of generic 500s
 *  - everything else is logged server-side and returned as a generic 500
 *
 * Usage: export const POST = withApiHandler(async (req) => { ... });
 */
export function withApiHandler<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<NextResponse>
) {
  return async (req: Request, ...args: Args): Promise<NextResponse> => {
    try {
      if (UNSAFE_METHODS.has(req.method) && !originIsTrusted(req)) {
        return apiError("Cross-origin request blocked.", 403, "ORIGIN_MISMATCH");
      }
      return await handler(req, ...args);
    } catch (err) {
      return handleApiError(err);
    }
  };
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return apiError(err.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // unique constraint violation
        return apiError("That record already exists.", 409, "DUPLICATE");
      case "P2025": // record not found for update/delete
        return apiError("Not found.", 404, "NOT_FOUND");
      default:
        break;
    }
  }

  // Anything unexpected: log full detail server-side only, never to the client.
  console.error("[api] unhandled error:", err);
  return apiError("Something went wrong. Please try again.", 500, "INTERNAL_ERROR");
}

/** Safely parse a JSON request body; never throws on malformed input. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
