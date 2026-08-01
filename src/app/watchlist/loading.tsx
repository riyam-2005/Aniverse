import { AnimeGridSkeleton } from "@/components/Skeleton";

export default function WatchlistLoading() {
  return (
    <div className="container-page py-10">
      <div className="mb-8 space-y-2">
        <div className="h-3 w-32 skeleton rounded bg-panel2" />
        <div className="h-9 w-56 skeleton rounded bg-panel2" />
      </div>
      <AnimeGridSkeleton count={8} />
    </div>
  );
}
