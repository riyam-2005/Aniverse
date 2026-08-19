/**
 * Loading placeholders for anime-card grids. Mirrors AnimeCard's markup
 * (aspect-[2/3] poster + two text lines) so pages don't jump/reflow once
 * real data swaps in.
 */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="aspect-[2/3] skeleton" />
      <div className="space-y-2 p-2.5">
        <div className="h-3.5 w-5/6 skeleton rounded bg-panel2" />
        <div className="h-3 w-1/3 skeleton rounded bg-panel2" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** A page-level skeleton: eyebrow + heading + tab row + grid. */
export function PageWithTabsSkeleton({ tabCount = 4 }: { tabCount?: number }) {
  return (
    <div className="container-page py-10">
      <div className="h-3 w-24 skeleton rounded bg-panel2" />
      <div className="mt-2 h-11 w-64 skeleton rounded bg-panel2" />

      <div className="mt-6 flex gap-2 border-b border-line pb-4">
        {Array.from({ length: tabCount }).map((_, i) => (
          <div key={i} className="h-7 w-20 skeleton rounded bg-panel2" />
        ))}
      </div>

      <div className="mt-8">
        <GridSkeleton />
      </div>
    </div>
  );
}
