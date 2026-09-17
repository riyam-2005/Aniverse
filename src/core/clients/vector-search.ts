import OpenAI from "openai";
import { createClient } from "@/core/clients/supabase-server";
import { searchAnime } from "@/core/clients/jikan";

export interface SemanticSearchResult {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  score: number | null;
  images: any;
  genres: any;
  similarity: number;
  source: "pgvector" | "keyword_fallback";
}

export interface SemanticSearchOptions {
  limit?: number;
  threshold?: number;
}

/**
 * Generates dense 1536-dimensional embedding using OpenAI text-embedding-3-small.
 * Returns null if OpenAI API key is missing or generation fails.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n+/g, " ").trim(),
      encoding_format: "float",
    });

    return response.data[0]?.embedding ?? null;
  } catch (err) {
    console.warn("[vector-search] OpenAI embedding generation failed, using fallback:", err);
    return null;
  }
}

/**
 * Performs semantic vector similarity search using Supabase pgvector RPC function `match_anime`.
 * Gracefully falls back to database / Jikan keyword search if pgvector is unavailable or cold.
 */
export async function semanticSearchAnime(
  query: string,
  options: SemanticSearchOptions = {}
): Promise<SemanticSearchResult[]> {
  const limit = options.limit ?? 10;
  const threshold = options.threshold ?? 0.45;

  const embedding = await generateEmbedding(query);

  if (embedding) {
    try {
      const supabase = createClient();
      // First try match_anime_synopsis (V4 primary)
      let { data, error } = await supabase.rpc("match_anime_synopsis", {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
      });

      // Fallback to match_anime if match_anime_synopsis not found
      if (error || !data || data.length === 0) {
        const fallbackRes = await supabase.rpc("match_anime", {
          query_embedding: embedding,
          match_threshold: threshold,
          match_count: limit,
        });
        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
          error = null;
        }
      }

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row: any) => ({
          mal_id: row.mal_id,
          title: row.title,
          title_english: row.title_english ?? null,
          synopsis: row.synopsis ?? null,
          score: row.score ? Number(row.score) : null,
          images: row.images ?? null,
          genres: row.genres ?? null,
          similarity: Number(row.similarity.toFixed(4)),
          source: "pgvector",
        }));
      }
    } catch (err) {
      console.warn("[vector-search] Supabase vector RPC failed, falling back to keyword search:", err);
    }
  }

  // Graceful Fallback: Query Jikan or DB keyword matching
  try {
    const jikanResults = await searchAnime(query, 1);
    const list = jikanResults?.data ?? [];

    return list.slice(0, limit).map((a, idx) => ({
      mal_id: a.mal_id,
      title: a.title,
      title_english: a.title_english ?? null,
      synopsis: a.synopsis ?? null,
      score: a.score ?? null,
      images: a.images,
      genres: a.genres,
      // Synthetic decaying similarity score for fallback ranking
      similarity: Math.max(0.5, 0.95 - idx * 0.05),
      source: "keyword_fallback",
    }));
  } catch (err) {
    console.error("[vector-search] Fallback search also failed:", err);
    return [];
  }
}
