import { describe, expect, it } from "vitest";
import { bucketByDay, percentChange, topGenreIds } from "./analytics";

describe("percentChange", () => {
  it("computes a positive percent change", () => {
    expect(percentChange(120, 100)).toBe(20);
  });

  it("computes a negative percent change", () => {
    expect(percentChange(80, 100)).toBe(-20);
  });

  it("rounds to one decimal place", () => {
    expect(percentChange(103, 90)).toBeCloseTo(14.4, 1);
  });

  it("returns 0 when both current and previous are 0", () => {
    expect(percentChange(0, 0)).toBe(0);
  });

  it("returns null when there's no baseline but current is positive", () => {
    expect(percentChange(5, 0)).toBeNull();
  });
});

describe("bucketByDay", () => {
  it("returns one bucket per day, oldest first, inclusive of today", () => {
    const now = new Date("2026-07-30T12:00:00Z");
    const result = bucketByDay([], 3, now);
    expect(result.map((b) => b.date)).toEqual(["2026-07-28", "2026-07-29", "2026-07-30"]);
  });

  it("counts timestamps into the correct day bucket", () => {
    const now = new Date("2026-07-30T12:00:00Z");
    const result = bucketByDay(
      ["2026-07-29T01:00:00Z", "2026-07-29T23:00:00Z", "2026-07-30T00:00:00Z"],
      3,
      now
    );
    const byDate = Object.fromEntries(result.map((b) => [b.date, b.count]));
    expect(byDate["2026-07-29"]).toBe(2);
    expect(byDate["2026-07-30"]).toBe(1);
    expect(byDate["2026-07-28"]).toBe(0);
  });

  it("ignores timestamps outside the requested window", () => {
    const now = new Date("2026-07-30T12:00:00Z");
    const result = bucketByDay(["2026-01-01T00:00:00Z"], 3, now);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });

  it("accepts Date objects as well as ISO strings", () => {
    const now = new Date("2026-07-30T12:00:00Z");
    const result = bucketByDay([new Date("2026-07-30T05:00:00Z")], 1, now);
    expect(result[0].count).toBe(1);
  });
});

describe("topGenreIds", () => {
  it("counts genre ids across comma-separated lists and sorts descending", () => {
    const result = topGenreIds(["1,4,10", "4,10", "10"]);
    expect(result).toEqual([
      { genreId: 10, count: 3 },
      { genreId: 4, count: 2 },
      { genreId: 1, count: 1 },
    ]);
  });

  it("ignores empty strings and non-numeric junk", () => {
    const result = topGenreIds(["", "4, , abc,4"]);
    expect(result).toEqual([{ genreId: 4, count: 2 }]);
  });

  it("respects the limit parameter", () => {
    const result = topGenreIds(["1", "2", "3", "4"], 2);
    expect(result).toHaveLength(2);
  });

  it("returns an empty array when given no data", () => {
    expect(topGenreIds([])).toEqual([]);
  });
});
