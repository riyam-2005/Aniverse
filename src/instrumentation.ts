export async function register() {
  // Only run in the Node.js server runtime (not edge, not the browser).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}

/**
 * Next.js's global server-error hook — fires for any unhandled error in a
 * Server Component, Route Handler, or Server Action, in addition to
 * whatever local try/catch already handles it. This is deliberately just a
 * structured console log rather than a full APM integration: wiring an
 * actual provider (Sentry, Datadog, etc.) is a couple of lines here once
 * you have an account/DSN for one, but hardcoding one now would mean
 * shipping a dependency + config nobody's asked for yet. The structured
 * shape (JSON on one line) is what makes this useful even without a
 * provider — it's grep/query-able in whatever log viewer the host gives
 * you (Vercel's log drains, `docker logs`, etc.).
 */
export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routeType: string }
) {
  console.error(
    JSON.stringify({
      level: "error",
      source: "onRequestError",
      path: request.path,
      method: request.method,
      routeType: context.routeType,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      time: new Date().toISOString(),
    })
  );
}
