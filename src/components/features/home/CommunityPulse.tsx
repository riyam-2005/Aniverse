import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/core/clients/supabase-server";
import { BLUR_DATA_URL } from "@/core/utils/image";

export default async function CommunityPulse() {
  const supabase = createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [usersCountRes, libraryCountRes, recentAddsRes, topAddsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_anime").select("id", { count: "exact", head: true }),
    supabase.from("user_anime").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase
      .from("user_anime")
      .select("mal_id, title, image_url")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalUsers = usersCountRes.count || 0;
  const totalWatchlistItems = libraryCountRes.count || 0;
  const recentAdds = recentAddsRes.count || 0;
  const topAdded = topAddsRes.data || [];

  return (
    <section className="container-page py-10">
      <div className="mb-5">
        <p className="eyebrow mb-1.5">Real Activity</p>
        <h2 className="font-display text-3xl tracking-wide text-ink">Community Pulse</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col justify-center gap-4 rounded-xl border border-line bg-panel p-6">
          <div>
            <p className="font-display text-4xl text-cyan">{totalUsers}</p>
            <p className="text-xs text-ink-faint">members tracking anime</p>
          </div>
          <div>
            <p className="font-display text-4xl text-pink">{totalWatchlistItems}</p>
            <p className="text-xs text-ink-faint">titles in personal libraries</p>
          </div>
          <div>
            <p className="font-display text-4xl text-amber-400">{recentAdds}</p>
            <p className="text-xs text-ink-faint">added in the last 7 days</p>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            Recently Added to Libraries
          </p>
          {topAdded.length > 0 ? (
            <div className="space-y-3">
              {topAdded.map((item, i) => (
                <Link
                  key={`${item.mal_id}-${i}`}
                  href={`/anime/${item.mal_id}`}
                  className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-panel2"
                >
                  <span className="w-5 shrink-0 font-mono text-sm text-ink-faint">
                    {i + 1}
                  </span>
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded border border-line">
                    {item.image_url && (
                      <Image
                        src={item.image_url}
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
                  <span className="shrink-0 font-mono text-xs text-cyan">
                    Tracking
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-dim">
              No watchlist activity yet this week — start exploring and adding titles!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
