import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { BLUR_DATA_URL } from "@/lib/image";

// Real, aggregate numbers only — no individual usernames or invented
// comments. This queries actual WatchlistItem rows so what's shown here
// is always true, even if that means showing very little on a fresh install.
export default async function CommunityPulse() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalWatchlistItems, recentAdds, topAddedRaw] = await Promise.all([
    prisma.user.count(),
    prisma.watchlistItem.count(),
    prisma.watchlistItem.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.watchlistItem.groupBy({
      by: ["malId", "title", "imageUrl"],
      _count: { malId: true },
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { _count: { malId: "desc" } },
      take: 5,
    }),
  ]);

  const hasActivity = topAddedRaw.length > 0;

  return (
    <section className="container-page py-10">
      <div className="mb-5">
        <p className="eyebrow mb-1.5">Real activity, no filler</p>
        <h2 className="font-display text-3xl tracking-wide text-ink">Community pulse</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col justify-center gap-4 rounded-xl border border-line bg-panel p-6">
          <div>
            <p className="font-display text-4xl text-cyan">{totalUsers}</p>
            <p className="text-xs text-ink-faint">members tracking anime</p>
          </div>
          <div>
            <p className="font-display text-4xl text-pink">{totalWatchlistItems}</p>
            <p className="text-xs text-ink-faint">titles on watchlists</p>
          </div>
          <div>
            <p className="font-display text-4xl text-amber">{recentAdds}</p>
            <p className="text-xs text-ink-faint">added in the last 7 days</p>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            Most added this week
          </p>
          {hasActivity ? (
            <div className="space-y-3">
              {topAddedRaw.map((item, i) => (
                <Link
                  key={item.malId}
                  href={`/anime/${item.malId}`}
                  className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-panel2"
                >
                  <span className="w-5 shrink-0 font-mono text-sm text-ink-faint">
                    {i + 1}
                  </span>
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded border border-line">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    )}
                  </div>
                  <span className="line-clamp-1 flex-1 text-sm text-ink group-hover:text-cyan transition-colors">
                    {item.title}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-ink-faint">
                    +{item._count.malId}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-dim">
              No watchlist activity yet this week — be the first to add a title and
              you&apos;ll show up here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
