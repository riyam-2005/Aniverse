import Link from "next/link";
import type { Metadata } from "next";
import { getSchedule } from "@/lib/jikan";
import { WEEKDAYS, type Weekday } from "@/types/anime";
import AnimeCard from "@/components/AnimeCard";
import OfflinePicksNotice from "@/components/OfflinePicksNotice";
import { FALLBACK_ANIME } from "@/lib/fallback-anime";

export const revalidate = 3600;
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Weekly Airing Schedule — AniVerse",
  description:
    "The full weekly anime broadcast schedule — see what's airing each day so you never miss an episode.",
  openGraph: {
    title: "Weekly Airing Schedule — AniVerse",
    description: "The full weekly anime broadcast schedule — see what's airing each day.",
    type: "website",
  },
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams?: { day?: string };
}) {
  const todayIndex = new Date().getDay();
  const todayLabel = WEEKDAYS[todayIndex];
  const day: Weekday = searchParams?.day && WEEKDAYS.includes(searchParams.day as Weekday)
    ? (searchParams.day as Weekday)
    : todayLabel;

  const raw = await getSchedule(day).catch(() => null);
  const failed = raw === null;
  const result = raw ?? { data: failed ? FALLBACK_ANIME : [] };

  return (
    <div className="container-page py-10">
      <p className="eyebrow mb-1.5">Broadcast guide</p>
      <h1 className="font-display text-5xl tracking-wide text-ink">
        Weekly Schedule
      </h1>
      <p className="mt-3 max-w-xl text-sm text-ink-dim">
        Times are as broadcast in Japan (JST). Convert to your local time
        before you plan your week.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-px">
        {WEEKDAYS.map((d) => (
          <Link
            key={d}
            href={`/schedule?day=${d}`}
            className={`rounded-t-md px-4 py-2 text-sm capitalize transition-colors ${
              day === d
                ? "border-b-2 border-cyan text-ink"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            {d}
            {d === todayLabel && (
              <span className="ml-1.5 font-mono text-[10px] text-pink">•</span>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {failed && <OfflinePicksNotice />}
        {!failed && result.data.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-ink-faint">
            Nothing on the guide for this day.
          </p>
        )}
        {result.data.map((a, i) => (
          <AnimeCard key={a.mal_id} anime={a} priority={i < 6} />
        ))}
      </div>
    </div>
  );
}
