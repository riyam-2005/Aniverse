import { GridSkeleton } from "@/components/skeletons/GridSkeleton";

export default function GenresLoading() {
  return (
    <div className="container-page py-10">
      <div className="h-3 w-16 skeleton rounded bg-panel2" />
      <div className="mt-2 h-11 w-40 skeleton rounded bg-panel2" />

      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-8 w-24 skeleton rounded-full bg-panel2" />
        ))}
      </div>

      <div className="mt-10 h-7 w-32 skeleton rounded bg-panel2" />

      <div className="mt-5">
        <GridSkeleton />
      </div>
    </div>
  );
}
