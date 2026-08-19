"use client";

/**
 * Shared visual for route-segment error.tsx boundaries. Jikan (the
 * third-party anime data source) is a single point of failure with no
 * uptime guarantee — lib/jikan.ts already retries, serves stale cache,
 * and trips a circuit breaker to absorb most of that. This is the last
 * line of defense for whatever still slips through, so the user sees a
 * clear message and a retry button instead of a blank page or a raw
 * Next.js crash screen.
 */
export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this right now. It might just be a hiccup with the anime data source — try again in a moment.",
  reset,
}: {
  title?: string;
  message?: string;
  reset?: () => void;
}) {
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="font-mono text-xs uppercase tracking-widest text-pink">
        Error
      </span>
      <h1 className="font-display text-3xl tracking-wide text-ink">{title}</h1>
      <p className="max-w-md text-sm text-ink-dim">{message}</p>
      {reset && (
        <button
          onClick={reset}
          className="btn-secondary mt-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}
