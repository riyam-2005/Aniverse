import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("jikan client resilience", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns data on a normal successful call", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ mal_id: 1 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const { getTopAnime } = await import("./jikan");
    const result = await getTopAnime(1);
    expect(result.data[0].mal_id).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once on a 429 and succeeds on the retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({ data: [{ mal_id: 42 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const { getTopAnime } = await import("./jikan");
    const result = await getTopAnime(1);
    expect(result.data[0].mal_id).toBe(42);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("serves a stale cached response when a later call fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ mal_id: 7 }] }))
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { getTopAnime } = await import("./jikan");
    const first = await getTopAnime(1);
    expect(first.data[0].mal_id).toBe(7);

    // Second call fails at the network level but should be served from
    // the stale cache recorded by the first call rather than throwing.
    const second = await getTopAnime(1);
    expect(second.data[0].mal_id).toBe(7);
  });

  it("throws when a call fails and there is no cached data to fall back on", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { getAnimeById } = await import("./jikan");
    // A genuine outage (network error, 5xx, circuit open) is NOT the same
    // thing as "this anime doesn't exist" — it must propagate so the
    // page's error.tsx boundary can show a retry UI instead of a
    // misleading 404.
    await expect(getAnimeById(999)).rejects.toThrow();
  });

  it("returns null (not a throw) when Jikan reports a genuine 404", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 404));
    vi.stubGlobal("fetch", fetchMock);

    const { getAnimeById } = await import("./jikan");
    const result = await getAnimeById(999);
    expect(result).toBeNull();
  });

  it("opens the circuit after repeated failures and stops calling fetch for new paths", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { getSchedule } = await import("./jikan");

    // Each call below hits a distinct path (different weekday), so none of
    // them can be served from stale cache — every one is a genuine failure
    // that should count toward tripping the breaker.
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
    for (const day of days) {
      await expect(getSchedule(day)).rejects.toThrow();
    }

    const callsBeforeCircuitOpen = fetchMock.mock.calls.length;

    // One more distinct path, immediately after tripping the breaker: the
    // circuit should short-circuit this to a rejection WITHOUT calling
    // fetch again, since there's no cache for this path either.
    await expect(getSchedule("saturday")).rejects.toThrow(/circuit open/i);
    expect(fetchMock.mock.calls.length).toBe(callsBeforeCircuitOpen);
  });
});
