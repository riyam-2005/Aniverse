import Link from "next/link";
import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import { safeJsonLdString } from "@/lib/json-ld";
import { getServerSession } from "next-auth/next";
import {
  getAnimeByGenre,
  getAnimeRecommendations,
  getGenres,
  getSchedule,
  getSeasonNow,
  getTopAiring,
  getTopAnime,
} from "@/lib/jikan";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WEEKDAYS } from "@/types/anime";
import type { Anime } from "@/types/anime";
import BroadcastTicker from "@/components/BroadcastTicker";
import HeroSpotlight from "@/components/HeroSpotlight";
import AnimeGrid from "@/components/AnimeGrid";
import SearchBar from "@/components/SearchBar";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import RecommendationsRow from "@/components/RecommendationsRow";
import CommunityPulse from "@/components/CommunityPulse";
import WelcomeBanner from "@/components/WelcomeBanner";
import type { ContinueItem } from "@/components/ContinueWatchingCard";
import { AnimeGridSkeleton } from "@/components/Skeleton";

// TopRankedRow and ShareSection are both "use client" components sitting
// below the fold (past Trending Now), so shipping their JS in the same
// chunk every visitor downloads up front — including everyone who never
// scrolls that far — is pure waste. next/dynamic code-splits each into its
// own chunk that only loads once it's actually needed for render, while
// still server-rendering the HTML (no ssr:false — this is a bundle-size
// win, not a hydration-avoidance one, and both sections should stay
// crawlable/SEO-visible on first paint).
const TopRankedRow = nextDynamic(() => import("@/components/TopRankedRow"), {
  loading: () => <AnimeGridSkeleton count={6} />,
});
const ShareSection = nextDynamic(() => import("@/components/ShareSection"));

// Continue Watching pulls from the signed-in user's session, so this page
// can no longer be a fully static/ISR route — it renders per-request. The
// underlying Jikan calls still hit Next's fetch data cache (see lib/jikan.ts),
// so this doesn't reintroduce the API-hammering the caching work solved.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const todayIndex = new Date().getDay();
  const dayLabel = WEEKDAYS[todayIndex];

  const [schedule, season, airing, top] = await Promise.all([
    getSchedule(dayLabel).catch(() => ({ data: [] })),
    getSeasonNow(1).catch(() => ({ data: [] })),
    getTopAiring(1).catch(() => ({ data: [] })),
    getTopAnime(1).catch(() => ({ data: [] })),
  ]);

  const spotlightSeen = new Set<number>();
  const spotlight = [...season.data, ...airing.data, ...top.data].filter((a) => {
    if (!a.images?.jpg?.large_image_url && !a.images?.jpg?.image_url) return false;
    if (spotlightSeen.has(a.mal_id)) return false;
    spotlightSeen.add(a.mal_id);
    return true;
  });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  let continueItems: ContinueItem[] = [];
  let recommendations: Awaited<ReturnType<typeof getAnimeRecommendations>> = [];
  let recommendationBasisTitles: string[] = [];
  let recommendationMode: "watchlist" | "genres" = "watchlist";

  if (userId) {
    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    continueItems = watchlist
      .filter((w) => w.status === "WATCHING")
      .slice(0, 12)
      .map((w) => ({
        id: w.id,
        malId: w.malId,
        title: w.title,
        imageUrl: w.imageUrl,
        totalEpisodes: w.totalEpisodes,
        progress: w.progress,
      }));

    // Personalized recommendations: pull Jikan's "because you watched X"
    // list for several of the user's most recent watchlist titles (not
    // just the last one), then rank candidates by how many source titles
    // recommended them — a title that shows up as a recommendation from
    // 3 different things you're watching is a stronger signal than one
    // that only came from a single title. Anything already on the
    // watchlist is excluded since recommending it back is pointless.
    const basisItems = watchlist.slice(0, 5);
    const watchlistIds = new Set(watchlist.map((w) => w.malId));

    if (basisItems.length > 0) {
      // Pull the user's own ratings for these titles (if they left any)
      // so a show they rated 9/10 counts for more than one they rated
      // 5/10 — plain watchlist presence treats every title equally,
      // which ignores signal the user already gave us for free.
      const userReviews = await prisma.review.findMany({
        where: { userId, animeMalId: { in: basisItems.map((item) => item.malId) } },
        select: { animeMalId: true, rating: true },
      });
      const ratingByMalId = new Map(userReviews.map((r) => [r.animeMalId, r.rating]));
      // No rating on file → weight 1 (same as before this change).
      // Rating out of 10 → weight scales from ~0.2 (rated 2) up to 2
      // (rated 10), so a loved title pulls harder than a middling one
      // without a single unrated basis item ever hitting zero weight.
      const weightFor = (malId: number) => {
        const rating = ratingByMalId.get(malId);
        return rating ? rating / 5 : 1;
      };

      const perTitleResults = await Promise.all(
        basisItems.map((item) =>
          getAnimeRecommendations(item.malId)
            .then((recs) => ({ title: item.title, malId: item.malId, recs }))
            .catch(() => ({
              title: item.title,
              malId: item.malId,
              recs: [] as Awaited<ReturnType<typeof getAnimeRecommendations>>,
            }))
        )
      );

      const scoreById = new Map<number, { anime: Anime; score: number }>();
      for (const { recs, malId } of perTitleResults) {
        const weight = weightFor(malId);
        for (const rec of recs) {
          if (watchlistIds.has(rec.mal_id)) continue;
          const existing = scoreById.get(rec.mal_id);
          if (existing) {
            existing.score += weight;
          } else {
            scoreById.set(rec.mal_id, { anime: rec, score: weight });
          }
        }
      }

      recommendations = Array.from(scoreById.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 18)
        .map((entry) => entry.anime);

      recommendationBasisTitles = perTitleResults
        .filter((r) => r.recs.length > 0)
        .map((r) => r.title);
    } else {
      // Cold start: nothing on the watchlist yet, so there's no viewing
      // history to rank against. Fall back to whatever genres they picked
      // during onboarding (see /onboarding + GenrePicker) instead of
      // showing an empty, invisible section — the alternative is new
      // users seeing zero personalization signal on their very first visit.
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferredGenres: true },
      });
      const genreIds = (user?.preferredGenres ?? "")
        .split(",")
        .filter(Boolean)
        .map(Number)
        .slice(0, 4);

      if (genreIds.length > 0) {
        const [allGenres, ...genreResults] = await Promise.all([
          getGenres().catch(() => []),
          ...genreIds.map((id) => getAnimeByGenre(id, 1).catch(() => ({ data: [] }))),
        ]);
        const genreNameById = new Map(allGenres.map((g) => [g.mal_id, g.name]));

        const seen = new Set<number>();
        const merged: Anime[] = [];
        // Round-robin across genres rather than dumping one genre's whole
        // page first, so a 4-genre pick doesn't get drowned out by
        // whichever genre happened to come back first.
        const pools = genreResults.map((r) => [...r.data]);
        while (merged.length < 18 && pools.some((p) => p.length > 0)) {
          for (const pool of pools) {
            const next = pool.shift();
            if (next && !seen.has(next.mal_id)) {
              seen.add(next.mal_id);
              merged.push(next);
            }
          }
        }

        recommendations = merged.slice(0, 18);
        recommendationBasisTitles = genreIds
          .map((id) => genreNameById.get(id))
          .filter((name): name is string => !!name);
        recommendationMode = "genres";
      }
    }
  }

  const homeItemListJsonLd = airing.data.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Trending Anime Right Now — AniVerse",
    itemListElement: airing.data.slice(0, 12).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/anime/${a.mal_id}`,
      name: a.title_english || a.title,
    })),
  } : null;

  return (
    <div>
      {homeItemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdString(homeItemListJsonLd) }}
        />
      )}
      <WelcomeBanner signedIn={Boolean(userId)} />

      <BroadcastTicker
        dayLabel={dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
        anime={schedule.data}
      />

      <HeroSpotlight items={spotlight} />

      <div className="container-page relative -mt-2 flex flex-wrap items-center justify-between gap-4 border-b border-line py-6 sm:-mt-4">
        <div>
          <p className="eyebrow mb-2">Live guide · {season.data.length} airing this season</p>
          <p className="max-w-xl text-sm text-ink-dim">
            AniVerse tracks the weekly broadcast schedule and everything
            MyAnimeList knows — so you always know what to watch next, and
            where to legally watch it.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <SearchBar />
          <div className="flex gap-6 font-mono text-xs text-ink-faint">
            <Link href="/schedule" className="hover:text-cyan transition-colors">
              Full weekly guide →
            </Link>
            <Link href="/genres" className="hover:text-cyan transition-colors">
              Browse by genre →
            </Link>
          </div>
        </div>
      </div>

      <ContinueWatchingRow items={continueItems} />

      <AnimeGrid
        title="This Season"
        eyebrow="Currently airing"
        anime={season.data}
        viewAllHref="/schedule"
      />

      <RecommendationsRow
        basedOnTitles={recommendationBasisTitles}
        anime={recommendations}
        mode={recommendationMode}
      />

      <AnimeGrid
        title="Trending Now"
        eyebrow="Most popular airing titles"
        anime={airing.data}
        viewAllHref="/trending"
      />
      <TopRankedRow
        title="All-Time Top Rated"
        eyebrow="By MyAnimeList score"
        anime={top.data}
      />

      {/* CommunityPulse runs its own Prisma query (recent watchlist
          activity) that has nothing to do with the Jikan data the rest of
          this page needs. Without a Suspense boundary, Next waits for
          every awaited piece — including this one — before sending any
          HTML; wrapping it lets the rest of the page flush to the browser
          immediately and this section stream in right behind it. */}
      <Suspense fallback={<AnimeGridSkeleton count={4} />}>
        <CommunityPulse />
      </Suspense>
      <ShareSection />
    </div>
  );
}
