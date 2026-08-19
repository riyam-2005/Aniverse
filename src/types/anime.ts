export interface AnimeImage {
  image_url: string;
  large_image_url?: string;
}

export interface Anime {
  mal_id: number;
  title: string;
  title_english?: string | null;
  images: {
    jpg: AnimeImage;
    webp?: AnimeImage;
  };
  synopsis?: string | null;
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  episodes?: number | null;
  status?: string | null;
  airing?: boolean;
  aired?: {
    from?: string | null;
    to?: string | null;
    string?: string | null;
  };
  duration?: string | null;
  rating?: string | null;
  season?: string | null;
  year?: number | null;
  genres?: { mal_id: number; name: string }[];
  studios?: { mal_id: number; name: string }[];
  trailer?: {
    youtube_id?: string | null;
    embed_url?: string | null;
  };
  streaming?: { name: string; url: string }[];
  broadcast?: {
    day?: string | null;
    time?: string | null;
    timezone?: string | null;
    string?: string | null;
  };
}

export interface JikanListResponse<T> {
  data: T[];
  pagination?: {
    has_next_page: boolean;
    current_page: number;
    last_visible_page: number;
  };
}

export interface JikanSingleResponse<T> {
  data: T;
}

export interface Genre {
  mal_id: number;
  name: string;
  count?: number;
}

export const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const STREAMING_PLATFORMS = [
  { name: "Crunchyroll", base: "https://www.crunchyroll.com/search?q=", color: "#F47521" },
  { name: "Netflix", base: "https://www.netflix.com/search?q=", color: "#E50914" },
  { name: "Hulu", base: "https://www.hulu.com/search?q=", color: "#1CE783" },
  { name: "Prime Video", base: "https://www.amazon.com/s?k=", color: "#00A8E1" },
  { name: "HIDIVE", base: "https://www.hidive.com/search?q=", color: "#4A3AFF" },
  { name: "Disney+", base: "https://www.disneyplus.com/search?q=", color: "#113CCF" },
  { name: "Max", base: "https://www.max.com/search?q=", color: "#9B51E0" },
];
