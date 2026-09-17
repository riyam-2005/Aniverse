import { GridSkeleton } from "@/components/skeletons/GridSkeleton";

export default function HomeLoading() {
  return (
    <div>
      <div className="h-10 w-full skeleton" />

      <div className="container-page relative -mt-2 py-6 sm:-mt-4">
        <div className="aspect-[21/9] w-full skeleton rounded-lg bg-panel2" />
      </div>

      <div className="container-page flex flex-wrap items-center justify-between gap-4 border-b border-line py-6">
        <div className="space-y-2">
          <div className="h-3 w-40 skeleton rounded bg-panel2" />
          <div className="h-3 w-72 skeleton rounded bg-panel2" />
        </div>
        <div className="h-10 w-64 skeleton rounded-full bg-panel2" />
      </div>

      <section className="container-page py-10">
        <div className="mb-5 h-8 w-48 skeleton rounded bg-panel2" />
        <GridSkeleton />
      </section>
    </div>
  );
}
