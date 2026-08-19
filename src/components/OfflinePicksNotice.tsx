/**
 * Shown above a grid of FALLBACK_ANIME so it's never mistaken for a live
 * ranking — pairs with FetchFailedNotice's "Try again" for the cases
 * where we still have nothing better to show.
 */
export default function OfflinePicksNotice() {
  return (
    <p className="col-span-full mb-2 flex items-center gap-1.5 text-xs text-ink-faint">
      <span className="h-1.5 w-1.5 rounded-full bg-amber" />
      Live data is temporarily unavailable — showing a set of popular picks instead.
    </p>
  );
}
