"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * For sections that intentionally swallow Jikan failures into an empty
 * list (so one bad section doesn't crash the whole page) — this makes
 * the difference between "nothing here" and "couldn't load it" visible
 * instead of rendering as the same blank grid, and gives the user a way
 * to try again without a full page reload.
 */
export default function FetchFailedNotice({
  message = "Couldn't load this right now — the anime data source may be temporarily unavailable.",
}: {
  message?: string;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  function retry() {
    setRetrying(true);
    router.refresh();
    // router.refresh() re-runs the server component fetch; if it succeeds
    // this notice unmounts. If it's still failing, release the button
    // back to a normal state so the user can try again.
    setTimeout(() => setRetrying(false), 1500);
  }

  return (
    <div className="col-span-full flex flex-col items-center gap-2 py-12 text-center text-sm text-ink-faint">
      <span className="font-mono text-[11px] uppercase tracking-widest text-pink/80">
        Couldn&apos;t load
      </span>
      <p>{message}</p>
      <button
        onClick={retry}
        disabled={retrying}
        className="mt-1 rounded-full border border-line px-4 py-1.5 text-xs text-ink-dim transition-colors hover:border-cyan/40 hover:text-ink disabled:opacity-50"
      >
        {retrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
