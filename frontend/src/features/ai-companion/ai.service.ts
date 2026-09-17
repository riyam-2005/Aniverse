import OpenAI from "openai";
import { searchAnime, getAnimeById, getTopAnime, getTopAiring } from "@/core/clients/jikan";
import { semanticSearchAnime } from "@/core/clients/vector-search";
import type { Anime } from "@/types/anime";

interface AIQueryIntent {
  searchQuery?: string;
  genreIds: number[];
  maxEpisodes?: number;
  minEpisodes?: number;
  type?: string; // 'tv' | 'movie'
  moods: string[];
  referenceTitle?: string;
}

const GENRE_MAP: Record<string, number> = {
  action: 1,
  adventure: 2,
  comedy: 4,
  mystery: 7,
  drama: 8,
  fantasy: 10,
  horror: 14,
  mecha: 18,
  music: 19,
  romance: 22,
  scifi: 24,
  "sci-fi": 24,
  sports: 30,
  supernatural: 37,
  psychological: 40,
  thriller: 41,
  sliceoflife: 36,
  "slice of life": 36,
  isekai: 62,
  military: 38,
  historical: 13,
  cyberpunk: 24,
};

/**
 * Extracts structured search filters and intent from user natural language prompt.
 */
export function extractIntent(prompt: string): AIQueryIntent {
  const lower = prompt.toLowerCase();
  const genreIds: number[] = [];
  const moods: string[] = [];

  for (const [name, id] of Object.entries(GENRE_MAP)) {
    if (lower.includes(name)) {
      if (!genreIds.includes(id)) genreIds.push(id);
    }
  }

  // Episode constraints
  let maxEpisodes: number | undefined;
  let minEpisodes: number | undefined;

  const underMatch = lower.match(/(?:under|less than|fewer than|max|within)\s+(\d+)\s*(?:episodes|eps)?/);
  if (underMatch) {
    maxEpisodes = parseInt(underMatch[1], 10);
  } else if (lower.includes("short") || lower.includes("quick")) {
    maxEpisodes = 13;
  }

  const overMatch = lower.match(/(?:over|more than|at least|min)\s+(\d+)\s*(?:episodes|eps)?/);
  if (overMatch) {
    minEpisodes = parseInt(overMatch[1], 10);
  }

  let type: string | undefined;
  if (lower.includes("movie") || lower.includes("film")) {
    type = "movie";
  } else if (lower.includes("ova")) {
    type = "ova";
  } else if (lower.includes("ona")) {
    type = "ona";
  } else if (lower.includes("series") || lower.includes("tv")) {
    type = "tv";
  }

  // Atmospheric mood detection
  if (lower.includes("emotional") || lower.includes("cry") || lower.includes("sad") || lower.includes("tear")) {
    moods.push("emotional");
    if (!genreIds.includes(8)) genreIds.push(8); // Drama
  }
  if (lower.includes("melancholic")) {
    moods.push("melancholic");
    if (!genreIds.includes(8)) genreIds.push(8); // Drama
  }
  if (lower.includes("dark") || lower.includes("gritty") || lower.includes("mature")) {
    moods.push("dark");
  }
  if (lower.includes("wholesome") || lower.includes("chill") || lower.includes("relaxing") || lower.includes("cozy")) {
    moods.push("wholesome");
    if (!genreIds.includes(36)) genreIds.push(36); // Slice of life
  }
  if (lower.includes("hype") || lower.includes("intense") || lower.includes("badass")) {
    moods.push("intense");
    if (!genreIds.includes(1)) genreIds.push(1); // Action
  }
  if (lower.includes("mind") || lower.includes("twist") || lower.includes("smart") || lower.includes("strategy")) {
    moods.push("mind-bending");
    if (!genreIds.includes(40)) genreIds.push(40); // Psychological
  }
  if (lower.includes("thought-provoking") || lower.includes("philosophical")) {
    moods.push("thought-provoking");
    if (!genreIds.includes(40)) genreIds.push(40); // Psychological
  }

  // Reference title extraction (e.g. "like Attack on Titan", "similar to Death Note")
  let referenceTitle: string | undefined;
  const likeMatch = lower.match(/(?:like|similar to|in the style of|comparable to)\s+([a-zA-Z0-9\s:!'-]+?)(?:$|\.|\?|,|but|with|under)/);
  if (likeMatch && likeMatch[1]) {
    referenceTitle = likeMatch[1].trim();
  }

  return {
    genreIds,
    maxEpisodes,
    minEpisodes,
    type,
    moods,
    referenceTitle,
    searchQuery: referenceTitle || undefined,
  };
}

export interface GroundedRecommendation {
  anime: Anime;
  reason: string;
  matchScore: number;
}

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AskAniverseResult {
  message: string;
  recommendations: GroundedRecommendation[];
  intent: AIQueryIntent;
}

/**
 * Grounded AI companion recommendation engine:
 * 1. Intent extraction with multi-turn context preservation
 * 2. Candidate generation from Jikan API
 * 3. Strict filtering & ranking
 * 4. LLM reasoning or heuristic explanation synthesis
 */
export async function askAniverse(
  prompt: string,
  userWatchlistMalIds: Set<number> = new Set(),
  history: ChatHistoryTurn[] = []
): Promise<AskAniverseResult> {
  const intent = extractIntent(prompt);

  // If user prompt is a follow-up or comparative refinement and lacks genre/reference,
  // borrow context from the prior user message in history
  if (history.length > 0 && intent.genreIds.length === 0 && !intent.referenceTitle) {
    const lastUserTurn = [...history].reverse().find((h) => h.role === "user");
    if (lastUserTurn) {
      const priorIntent = extractIntent(lastUserTurn.content);
      if (priorIntent.genreIds.length > 0) intent.genreIds.push(...priorIntent.genreIds);
      if (priorIntent.referenceTitle && !intent.referenceTitle) intent.referenceTitle = priorIntent.referenceTitle;
      if (priorIntent.type && !intent.type) intent.type = priorIntent.type;
    }
  }

  const candidatesMap = new Map<number, Anime>();

  // 1. Fetch Candidates based on intent
  const fetchPromises: Promise<unknown>[] = [];

  if (intent.referenceTitle) {
    fetchPromises.push(
      searchAnime(intent.referenceTitle, 1, { orderBy: "popularity" })
        .then((res) => {
          for (const a of res.data) {
            candidatesMap.set(a.mal_id, a);
          }
        })
        .catch(() => {})
    );
  }

  if (intent.genreIds.length > 0) {
    fetchPromises.push(
      searchAnime("", 1, {
        genres: intent.genreIds,
        type: intent.type,
        minScore: 7.0,
        orderBy: "score",
        sort: "desc",
      })
        .then((res) => {
          for (const a of res.data) {
            candidatesMap.set(a.mal_id, a);
          }
        })
        .catch(() => {})
    );
  }

  // Hybrid Vector Retrieval: ingest dense pgvector semantic candidates
  if (prompt.trim().length > 8) {
    fetchPromises.push(
      semanticSearchAnime(prompt, { limit: 6, threshold: 0.4 })
        .then((vectorResults) => {
          for (const res of vectorResults) {
            if (!candidatesMap.has(res.mal_id)) {
              candidatesMap.set(res.mal_id, {
                mal_id: res.mal_id,
                title: res.title,
                title_english: res.title_english,
                synopsis: res.synopsis,
                score: res.score,
                images: res.images || { jpg: { image_url: "", large_image_url: "" } },
                genres: res.genres || [],
              } as Anime);
            }
          }
        })
        .catch(() => {})
    );
  }

  // Fallback to top anime if candidates are sparse
  if (candidatesMap.size < 5) {
    fetchPromises.push(
      getTopAnime(1)
        .then((res) => {
          for (const a of res.data) {
            if (!candidatesMap.has(a.mal_id)) candidatesMap.set(a.mal_id, a);
          }
        })
        .catch(() => {})
    );
  }

  await Promise.all(fetchPromises);

  // 2. Filter & Rank candidates
  const filteredCandidates = Array.from(candidatesMap.values())
    .filter((a) => {
      // Exclude already watched
      if (userWatchlistMalIds.has(a.mal_id)) return false;

      // Filter episodes
      if (intent.maxEpisodes && a.episodes && a.episodes > intent.maxEpisodes) {
        return false;
      }
      if (intent.minEpisodes && a.episodes && a.episodes < intent.minEpisodes) {
        return false;
      }
      if (intent.type && a.type && a.type.toLowerCase() !== intent.type.toLowerCase()) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 6);

  // Fallback to top airing if filtered out completely
  const pool = filteredCandidates.length > 0 ? filteredCandidates : Array.from(candidatesMap.values()).slice(0, 4);

  // 3. Synthesis Layer (OpenAI or Rule-Based Grounded Engine)
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim().length > 0 && pool.length > 0) {
    try {
      const openai = new OpenAI({ apiKey });

      const animeContext = pool.map((a, idx) => ({
        index: idx + 1,
        mal_id: a.mal_id,
        title: a.title_english || a.title,
        score: a.score,
        episodes: a.episodes || "Unknown",
        type: a.type,
        genres: a.genres?.map((g) => g.name).join(", "),
        synopsis: a.synopsis?.slice(0, 200) || "",
      }));

      const systemPrompt = `You are Aniverse AI, a friendly, ultra-knowledgeable anime companion.
The user is conversing with you about anime recommendations.
Below is the VERIFIED list of retrieved anime candidates from the database:
${JSON.stringify(animeContext, null, 2)}

INSTRUCTIONS:
1. Maintain natural conversational continuity with prior turns if this is a follow-up or refinement.
2. Explain to the user why these specific anime are great recommendations for their request.
3. ONLY reference anime from the provided list. Do NOT invent other titles, scores, or facts.
4. Return a JSON response matching this schema:
{
  "message": "Friendly conversational intro and summary answering the user's prompt",
  "reasons": [
    { "mal_id": 123, "reason": "Specific 1-2 sentence explanation of why this matches their criteria" }
  ]
}`;

      const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
      ];

      // Add recent conversational context (up to 6 turns)
      for (const turn of history.slice(-6)) {
        chatMessages.push({
          role: turn.role,
          content: turn.content,
        });
      }

      chatMessages.push({
        role: "user",
        content: `User prompt: "${prompt}". Candidates:\n${JSON.stringify(animeContext, null, 2)}`,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const reasonsMap = new Map<number, string>();
        if (Array.isArray(parsed.reasons)) {
          for (const r of parsed.reasons) {
            if (r.mal_id && r.reason) reasonsMap.set(r.mal_id, r.reason);
          }
        }

        const recommendations: GroundedRecommendation[] = pool.map((a) => ({
          anime: a,
          reason:
            reasonsMap.get(a.mal_id) ||
            `Rated ${a.score ? `${a.score}/10` : "highly"} with ${a.episodes ? `${a.episodes} episodes` : "movie format"}, featuring ${a.genres?.slice(0, 3).map((g) => g.name).join(", ")}.`,
          matchScore: a.score ? Math.min(100, Math.round(a.score * 10)) : 85,
        }));

        return {
          message: parsed.message || `Here are top recommendations tailored to your request:`,
          recommendations,
          intent,
        };
      }
    } catch (err) {
      console.warn("[ai] OpenAI request failed, using grounded fallback generator:", err);
    }
  }

  // 4. Heuristic Grounded Fallback
  const recommendations: GroundedRecommendation[] = pool.map((a) => {
    let reason = `Critically acclaimed ${a.type || "series"} (Score: ${a.score || "8.0"}/10)`;
    if (a.episodes) reason += ` spanning ${a.episodes} episodes`;
    if (a.genres && a.genres.length > 0) {
      reason += ` highlighting ${a.genres.slice(0, 3).map((g) => g.name).join(", ")}.`;
    }

    if (intent.moods.length > 0) {
      reason += ` Delivers the ${intent.moods.join(" & ")} atmosphere you're looking for.`;
    }

    return {
      anime: a,
      reason,
      matchScore: a.score ? Math.min(100, Math.round(a.score * 10)) : 88,
    };
  });

  let message = `Found ${recommendations.length} standout anime matching your request.`;
  if (intent.maxEpisodes) {
    message += ` Filtered under ${intent.maxEpisodes} episodes for a quick, bingeable watch.`;
  }
  if (intent.moods.length > 0) {
    message += ` Curated specifically for ${intent.moods.join(", ")} vibes.`;
  }

  return {
    message,
    recommendations,
    intent,
  };
}
