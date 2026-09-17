import { describe, expect, it } from "vitest";
import { extractIntent } from "./ai.service";

describe("AI Companion Intent Extraction Engine (V4)", () => {
  it("extracts 18+ canonical genres accurately", () => {
    const militaryIntent = extractIntent("Give me a gritty military anime");
    expect(militaryIntent.genreIds).toContain(38); // Military
    expect(militaryIntent.moods).toContain("dark");

    const historicalIntent = extractIntent("A historical adventure series");
    expect(historicalIntent.genreIds).toContain(13); // Historical
    expect(historicalIntent.genreIds).toContain(2); // Adventure

    const cyberpunkIntent = extractIntent("Looking for intense cyberpunk anime");
    expect(cyberpunkIntent.genreIds).toContain(24); // Cyberpunk / Sci-Fi
    expect(cyberpunkIntent.moods).toContain("intense");
  });

  it("extracts OVA and ONA media types", () => {
    const ovaIntent = extractIntent("recommend me a good horror ova");
    expect(ovaIntent.type).toBe("ova");
    expect(ovaIntent.genreIds).toContain(14); // Horror

    const onaIntent = extractIntent("short sci-fi ona");
    expect(onaIntent.type).toBe("ona");
    expect(onaIntent.maxEpisodes).toBe(13);
  });

  it("detects atmospheric moods including melancholic and thought-provoking", () => {
    const melancholicIntent = extractIntent("I want something melancholic and sad");
    expect(melancholicIntent.moods).toContain("melancholic");
    expect(melancholicIntent.genreIds).toContain(8); // Drama

    const thoughtProvoking = extractIntent("A thought-provoking philosophical anime");
    expect(thoughtProvoking.moods).toContain("thought-provoking");
    expect(thoughtProvoking.genreIds).toContain(40); // Psychological
  });
});
