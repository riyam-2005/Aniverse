import type { Metadata } from "next";
import { getSchedule } from "@/lib/jikan";
import type { Weekday } from "@/types/anime";
import AnimeGrid from "@/components/AnimeGrid";
import FetchFailedNotice from "@/components/FetchFailedNotice";
import OfflinePicksNotice from "@/components/OfflinePicksNotice";
import { FALLBACK_ANIME } from "@/lib/fallback-anime";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Anime Release Calendar | AniVerse",
  description: "Weekly anime broadcast schedule with daily episode releases.",
};

const DAYS: { key: Weekday; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default async function SchedulePage({
  searchParams,
}: {
  searchParams?: { day?: string };
}) {
  const currentDay = (searchParams?.day?.toLowerCase() as Weekday) || "monday";
  const validDay: Weekday = DAYS.some((d) => d.key === currentDay) ? currentDay : "monday";

  const rawSchedule = await getSchedule(validDay).catch(() => null);
  const failed = rawSchedule === null;
  const animeList = rawSchedule?.data?.length ? rawSchedule.data : (failed ? FALLBACK_ANIME : []);

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="eyebrow mb-1.5">Weekly Broadcasts</p>
        <h1 className="font-display text-4xl text-ink">Anime Release Calendar</h1>
        <p className="mt-2 text-sm text-ink-dim max-w-xl">
          Track episode release schedules throughout the week. Select a day to view upcoming broadcasts.
        </p>
      </div>

      {failed && (
        <div className="mb-6">
          <OfflinePicksNotice />
        </div>
      )}

      {/* Day Selector Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-paper-border pb-4">
        {DAYS.map((d) => {
          const isActive = d.key === validDay;
          return (
            <Link
              key={d.key}
              href={`/schedule?day=${d.key}`}
              className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? "bg-cyan text-slate-950 shadow-md shadow-cyan/20 scale-105"
                  : "bg-paper-light text-ink-dim hover:bg-paper-hover hover:text-ink"
              }`}
            >
              {d.label}
            </Link>
          );
        })}
      </div>

      {/* Anime Grid for selected day */}
      {animeList.length > 0 ? (
        <AnimeGrid title={`Broadcasts for ${validDay.charAt(0).toUpperCase() + validDay.slice(1)}`} anime={animeList} />
      ) : (
        <div className="rounded-2xl bg-paper-light p-12 text-center border border-paper-border">
          <p className="text-lg font-medium text-ink">No scheduled broadcasts found for {validDay}</p>
          <p className="mt-1 text-sm text-ink-dim">Check back later for updated release schedules.</p>
        </div>
      )}
    </main>
  );
}
