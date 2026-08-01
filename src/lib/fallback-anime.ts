import type { Anime } from "@/types/anime";

/**
 * Last-resort content for Trending/Genres/Schedule when Jikan is down AND
 * there's no stale cache to fall back on yet (e.g. this exact route path
 * has never successfully been fetched on this deployment — a brand-new
 * environment, or a very unusual query nobody's hit before).
 *
 * This is intentionally a small, hand-picked, evergreen list — not live
 * data, so it's never wrong in a confusing way (no episode counts that
 * drift, no "airing" badge that goes stale). It exists purely so the grid
 * is never a blank error state; pages that use it always pair it with a
 * visible "showing offline picks" notice so nobody mistakes it for a live
 * ranking.
 */
export const FALLBACK_ANIME: Anime[] = [
  {
    mal_id: 16498,
    title: "Shingeki no Kyojin",
    title_english: "Attack on Titan",
    images: { jpg: { image_url: "" } },
    score: 8.5,
    episodes: 25,
    year: 2013,
  },
  {
    mal_id: 38524,
    title: "Shingeki no Kyojin Season 3 Part 2",
    title_english: "Attack on Titan Season 3 Part 2",
    images: { jpg: { image_url: "" } },
    score: 9.0,
    episodes: 10,
    year: 2019,
  },
  {
    mal_id: 40748,
    title: "Jujutsu Kaisen",
    title_english: "Jujutsu Kaisen",
    images: { jpg: { image_url: "" } },
    score: 8.5,
    episodes: 24,
    year: 2020,
  },
  {
    mal_id: 44511,
    title: "Chainsaw Man",
    title_english: "Chainsaw Man",
    images: { jpg: { image_url: "" } },
    score: 8.6,
    episodes: 12,
    year: 2022,
  },
  {
    mal_id: 5114,
    title: "Fullmetal Alchemist: Brotherhood",
    title_english: "Fullmetal Alchemist: Brotherhood",
    images: { jpg: { image_url: "" } },
    score: 9.1,
    episodes: 64,
    year: 2009,
  },
  {
    mal_id: 1535,
    title: "Death Note",
    title_english: "Death Note",
    images: { jpg: { image_url: "" } },
    score: 8.6,
    episodes: 37,
    year: 2006,
  },
  {
    mal_id: 21,
    title: "One Piece",
    title_english: "One Piece",
    images: { jpg: { image_url: "" } },
    score: 8.7,
    episodes: null,
    year: 1999,
  },
  {
    mal_id: 20958,
    title: "Boku no Hero Academia",
    title_english: "My Hero Academia",
    images: { jpg: { image_url: "" } },
    score: 7.9,
    episodes: 13,
    year: 2016,
  },
  {
    mal_id: 38000,
    title: "Kimetsu no Yaiba",
    title_english: "Demon Slayer",
    images: { jpg: { image_url: "" } },
    score: 8.5,
    episodes: 26,
    year: 2019,
  },
  {
    mal_id: 32281,
    title: "Kimi no Na wa.",
    title_english: "Your Name.",
    images: { jpg: { image_url: "" } },
    score: 8.9,
    episodes: 1,
    year: 2016,
  },
  {
    mal_id: 11061,
    title: "Hunter x Hunter (2011)",
    title_english: "Hunter x Hunter",
    images: { jpg: { image_url: "" } },
    score: 9.0,
    episodes: 148,
    year: 2011,
  },
  {
    mal_id: 9253,
    title: "Steins;Gate",
    title_english: "Steins;Gate",
    images: { jpg: { image_url: "" } },
    score: 9.1,
    episodes: 24,
    year: 2011,
  },
];
