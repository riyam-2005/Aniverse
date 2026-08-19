import { GridSkeleton } from "@/components/skeletons/GridSkeleton";

export default function SearchLoading() {
  return (
    <div className="container-page py-10">
      <div className="h-3 w-28 skeleton rounded bg-panel2" />
      <div className="mt-2 h-10 w-56 skeleton rounded bg-panel2" />
      <div className="mt-8">
        <GridSkeleton />
      </div>
    </div>
  );
}
