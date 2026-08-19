/** Base shimmer block — compose the specific skeletons below from this. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

/** Matches AnimeCard's dimensions: poster + title + meta line. */
export function AnimeCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <SkeletonBlock className="aspect-[2/3] w-full" />
      <SkeletonBlock className="h-4 w-4/5" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  );
}

/** A horizontal row of poster-card skeletons, e.g. for a carousel section. */
export function AnimeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Matches the anime detail page's hero block: poster + title/meta lines. */
export function AnimeHeroSkeleton() {
  return (
    <div className="flex gap-6">
      <SkeletonBlock className="h-64 w-44 shrink-0" />
      <div className="flex-1 space-y-3 pt-2">
        <SkeletonBlock className="h-8 w-2/3" />
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-20 w-full" />
      </div>
    </div>
  );
}

/** Single comment row. */
export function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function CommentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}
