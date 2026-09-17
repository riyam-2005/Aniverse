export default function AnimeDetailLoading() {
  return (
    <div>
      <div className="border-b border-line">
        <div className="container-page grid grid-cols-1 gap-8 py-12 sm:grid-cols-[220px_1fr] sm:py-16">
          <div className="aspect-[2/3] w-full max-w-[220px] skeleton rounded-lg border border-line bg-panel2" />

          <div className="space-y-4">
            <div className="h-11 w-3/4 skeleton rounded bg-panel2" />
            <div className="flex gap-4">
              <div className="h-4 w-16 skeleton rounded bg-panel2" />
              <div className="h-4 w-24 skeleton rounded bg-panel2" />
              <div className="h-4 w-20 skeleton rounded bg-panel2" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-20 skeleton rounded-full bg-panel2" />
              <div className="h-6 w-16 skeleton rounded-full bg-panel2" />
              <div className="h-6 w-24 skeleton rounded-full bg-panel2" />
            </div>
            <div className="max-w-2xl space-y-2 pt-2">
              <div className="h-3 w-full skeleton rounded bg-panel2" />
              <div className="h-3 w-full skeleton rounded bg-panel2" />
              <div className="h-3 w-2/3 skeleton rounded bg-panel2" />
            </div>
            <div className="h-11 w-40 skeleton rounded-md bg-panel2" />
          </div>
        </div>
      </div>

      <div className="container-page grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <div className="aspect-video w-full skeleton rounded-lg bg-panel2" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full skeleton rounded-md bg-panel2" />
          ))}
        </div>
      </div>
    </div>
  );
}
