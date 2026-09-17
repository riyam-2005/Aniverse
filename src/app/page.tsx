import { safeJsonLdString } from "@/core/utils/json-ld";
import { getUser } from "@/core/clients/supabase-server";
import {
  getAnimeByGenre,
  getAnimeRecommendations,
  getSchedule,
  getSeasonNow,
  getTopAiring,
  getTopAnime,
} from "@/core/clients/jikan";
import { FALLBACK_ANIME } from "@/features/ai-companion/fallback.service";
import { WEEKDAYS } from "@/types/anime";
import type { Anime } from "@/types/anime";

// New components matching target reference design
import ShareBanner from "@/components/home/ShareBanner";
import AniverseHero from "@/components/home/AniverseHero";
import ScrollCharacterCard from "@/components/anime-character/ScrollCharacterCard";
import CommunitySection from "@/components/home/CommunitySection";
import TopAiringSection from "@/components/home/TopAiringSection";
import RankingCarousels from "@/components/home/RankingCarousels";
import RecommendationsRow from "@/components/features/home/RecommendationsRow";
import AnimeDNAWidget from "@/components/home/AnimeDNAWidget";
import StatsStrip from "@/components/home/StatsStrip";
import WelcomeBanner from "@/components/features/home/WelcomeBanner";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const todayIndex = new Date().getDay();
  const dayLabel = WEEKDAYS[todayIndex];

  // Fetch real data with fallback resilience
  const [rawSchedule, rawSeason, rawAiring, rawTop] = await Promise.all([
    getSchedule(dayLabel).catch(() => ({ data: [] })),
    getSeasonNow(1).catch(() => ({ data: [] })),
    getTopAiring(1).catch(() => ({ data: [] })),
    getTopAnime(1).catch(() => ({ data: [] })),
  ]);

  const schedule = {
    data: rawSchedule.data?.length > 0 ? rawSchedule.data : FALLBACK_ANIME,
  };
  const season = {
    data: rawSeason.data?.length > 0 ? rawSeason.data : FALLBACK_ANIME,
  };
  const airing = {
    data: rawAiring.data?.length > 0 ? rawAiring.data : FALLBACK_ANIME,
  };
  const top = {
    data: rawTop.data?.length > 0 ? rawTop.data : FALLBACK_ANIME,
  };

  let user: any = null;
  try {
    user = await getUser();
  } catch {
    user = null;
  }

  // Recommendations: personalized if user has genres / history, else fallback
  let recommendations: Anime[] = [];
  let recommendationBasisTitles: string[] = [];
  let recommendationMode: "watchlist" | "genres" = "watchlist";

  if (season.data.length > 0) {
    recommendations = season.data.slice(0, 10);
    recommendationBasisTitles = [season.data[0]?.title || "Airing Shows"];
    recommendationMode = "genres";
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "AniVerse — Your AI-Powered Anime Companion",
    description:
      "Discover, track, and explore anime with AI-powered personalized recommendations, live airing schedules, and community discussions.",
  };

  return (
    <div className="flex flex-col space-y-6 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(websiteJsonLd) }}
      />

      {/* Floating Scroll Mascot Indicator Card */}
      <ScrollCharacterCard />

      {/* 1. Share Banner */}
      <section id="share">
        <ShareBanner />
      </section>

      {/* 2. AI Hero Centerpiece */}
      <section id="hero" className="container-page pt-2 sm:pt-4">
        <AniverseHero />
      </section>

      {/* 3. Community / Comments Section */}
      <section id="community">
        <CommunitySection />
      </section>

      {/* 4. Top Airing Today */}
      <section id="schedule">
        <TopAiringSection anime={schedule.data} />
      </section>

      {/* 5. Most Popular & Most Favourite Ranking Carousels */}
      <section id="trending">
        <RankingCarousels
          popularAnime={airing.data}
          favouriteAnime={top.data}
        />
      </section>

      {/* 6. Personalized Recommendations */}
      {recommendations.length > 0 && (
        <section id="recommendations">
          <RecommendationsRow
            basedOnTitles={recommendationBasisTitles}
            anime={recommendations}
            mode={recommendationMode}
          />
        </section>
      )}

      {/* 7. Anime DNA Archetype Widget */}
      <section id="anime-dna">
        <AnimeDNAWidget />
      </section>

      {/* 8. Bottom Statistics Strip */}
      <section id="stats">
        <StatsStrip />
      </section>

      {/* Welcome Banner for Guests */}
      <WelcomeBanner signedIn={Boolean(user)} />
    </div>
  );
}
