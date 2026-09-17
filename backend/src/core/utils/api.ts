import { NextResponse } from "next/server";
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
    res.headers.set(
      "Cache-Control",
      `${scope}, max-age=${cache.maxAge}, stale-while-revalidate=${swr}`
    );
  }
  return res;
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * The set of origins this app is actually served from.
 */
function trustedOrigins(): string[] {
  const urls = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    "http://localhost:3000",
  ].filter((u): u is string => Boolean(u));
  return urls.map((u) => {
    try {
      return new URL(u).origin;
    } catch {
      return u;
    }
  });
}

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
 * Wraps a route handler for safe execution, CSRF checks, and error normalization.
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

  // Handle PostgREST / Supabase database errors
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case "23505": // PostgreSQL unique violation
        return apiError("That record already exists.", 409, "DUPLICATE");
      case "PGRST116": // Result contains 0 rows when single row expected
        return apiError("Not found.", 404, "NOT_FOUND");
      default:
        break;
    }
  }

  // Anything unexpected: log full detail server-side only, never leak internals to the client.
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
