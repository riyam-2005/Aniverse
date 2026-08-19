import { apiOk, withApiHandler } from "@/lib/api";
import { getTopAnime } from "@/lib/jikan";
import { FALLBACK_ANIME } from "@/lib/fallback-anime";

export const GET = withApiHandler(async (req: Request) => {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  const topData = await getTopAnime(page).catch(() => ({
    data: FALLBACK_ANIME,
    pagination: { has_next_page: false },
  }));

  return apiOk({
    anime: topData.data || FALLBACK_ANIME,
    pagination: topData.pagination || { has_next_page: false },
    updatedAt: new Date().toISOString(),
  });
});
