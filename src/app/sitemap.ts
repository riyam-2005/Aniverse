import type { MetadataRoute } from "next";
import { getTopAnime } from "@/lib/jikan";

const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/trending`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/schedule`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/genres`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/community`, changeFrequency: "daily", priority: 0.5 },
    { url: `${siteUrl}/search`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/register`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.1 },
  ];

  // Best-effort: include a batch of real anime detail pages so search
  // engines can discover them without crawling links one hop at a time.
  // If Jikan is unreachable, fall back to just the static routes rather
  // than failing the whole sitemap.
  try {
    const [page1, page2] = await Promise.all([getTopAnime(1), getTopAnime(2)]);
    const animeRoutes: MetadataRoute.Sitemap = [...page1.data, ...page2.data].map((a) => ({
      url: `${siteUrl}/anime/${a.mal_id}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    return [...staticRoutes, ...animeRoutes];
  } catch {
    return staticRoutes;
  }
}
