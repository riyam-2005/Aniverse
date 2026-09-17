import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateEmbedding, semanticSearchAnime } from "@/core/clients/vector-search";

const mockRpc = vi.fn().mockImplementation((fnName: string) => {
  if (fnName === "match_anime_synopsis") {
    return Promise.resolve({
      data: [
        {
          mal_id: 16498,
          title: "Attack on Titan",
          title_english: "Attack on Titan",
          synopsis: "Humans fight titans behind giant walls.",
          score: 8.54,
          images: { jpg: { image_url: "https://example.com/aot.jpg" } },
          genres: [{ mal_id: 1, name: "Action" }],
          similarity: 0.8921,
        },
      ],
      error: null,
    });
  }
  return Promise.resolve({ data: null, error: new Error("Unknown RPC") });
});

vi.mock("@/core/clients/supabase-server", () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}));

vi.mock("@/core/clients/jikan", () => ({
  searchAnime: vi.fn().mockResolvedValue({
    data: [
      {
        mal_id: 5114,
        title: "Fullmetal Alchemist: Brotherhood",
        title_english: "Fullmetal Alchemist: Brotherhood",
        synopsis: "Two brothers search for Philosopher's Stone.",
        score: 9.1,
        images: { jpg: { image_url: "https://example.com/fma.jpg" } },
        genres: [{ mal_id: 1, name: "Action" }],
      },
    ],
  }),
}));

describe("Vector Search Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null embedding when OPENAI_API_KEY is not configured", async () => {
    delete process.env.OPENAI_API_KEY;
    const embedding = await generateEmbedding("action anime with giant mechs");
    expect(embedding).toBeNull();
  });

  it("falls back to keyword search when OpenAI embedding is not generated", async () => {
    delete process.env.OPENAI_API_KEY;
    const results = await semanticSearchAnime("alchemy fantasy adventure");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain("Fullmetal");
    expect(results[0].source).toBe("keyword_fallback");
  });
});
