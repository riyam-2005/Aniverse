import Link from "next/link";
import Image from "next/image";
import type { Anime } from "@/types/anime";

export default function BroadcastTicker({
  dayLabel,
  anime,
}: {
  dayLabel: string;
  anime: Anime[];
}) {
  const items = anime.slice(0, 12);

  return (
    <div className="border-y border-line bg-panel/60">
      <div className="container-page flex items-center gap-4 py-2.5">
        <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-pink">
          <span className="on-air-dot" />
          On air · {dayLabel}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {items.length === 0 && (
            <span className="font-mono text-xs text-ink-faint">
              Nothing scheduled today — check the full guide.
            </span>
          )}
          {items.map((a) => (
            <Link
              key={a.mal_id}
              href={`/anime/${a.mal_id}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-panel2 py-1 pl-1 pr-3 transition-colors hover:border-cyan/50"
            >
              <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-void">
                {a.images?.jpg?.image_url && (
                  <Image
                    src={a.images.jpg.image_url}
                    alt=""
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                )}
              </span>
              <span className="whitespace-nowrap text-xs text-ink-dim">
                {a.title_english || a.title}
              </span>
              {a.broadcast?.time && (
                <span className="whitespace-nowrap font-mono text-[10px] text-ink-faint">
                  {a.broadcast.time} JST
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
