import { SkeletonBlock } from "@/components/Skeleton";

export default function CommunityLoading() {
  return (
    <div className="container-page py-10">
      <div className="mb-8 space-y-2">
        <div className="h-3 w-24 skeleton rounded bg-panel2" />
        <div className="h-9 w-56 skeleton rounded bg-panel2" />
        <div className="h-4 w-96 max-w-full skeleton rounded bg-panel2" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-line bg-panel p-4">
            <SkeletonBlock className="h-20 w-14 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <SkeletonBlock className="h-3 w-1/3" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
