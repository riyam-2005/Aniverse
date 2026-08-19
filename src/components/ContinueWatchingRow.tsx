import Carousel from "./Carousel";
import ContinueWatchingCard, { type ContinueItem } from "./ContinueWatchingCard";

export default function ContinueWatchingRow({ items }: { items: ContinueItem[] }) {
  if (!items.length) return null;

  return (
    <section className="container-page py-10">
      <div className="mb-5">
        <p className="eyebrow mb-1.5">Pick up where you left off</p>
        <h2 className="font-display text-3xl tracking-wide text-ink">
          Continue Watching
        </h2>
      </div>
      <Carousel>
        {items.map((item) => (
          <ContinueWatchingCard key={item.id} item={item} />
        ))}
      </Carousel>
    </section>
  );
}
