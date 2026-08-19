"use client";

import { useEffect } from "react";

/**
 * Reports client-side errors to Sentry if configured, otherwise just logs
 * to the console. Kept as a single choke point so wiring in a real error
 * monitoring service later is a one-file change.
 *
 * To activate real error monitoring:
 *   1. Create a free account at https://sentry.io
 *   2. `npm install @sentry/nextjs` and run `npx @sentry/wizard@latest -i nextjs`
 *      (this generates sentry.client.config.ts / sentry.server.config.ts)
 *   3. Set NEXT_PUBLIC_SENTRY_DSN in your .env
 * Until then, this function still gives you console visibility for free.
 */
export function reportError(error: Error, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[error]", error, context);
    return;
  }

  // Placeholder for Sentry.captureException(error, { extra: context }) —
  // intentionally not importing @sentry/nextjs here since it isn't
  // installed yet; see the setup steps above.
  console.error("[error]", error, context);
}

export default function ErrorReporter({ error }: { error: Error }) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return null;
}
