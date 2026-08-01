import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// No UPSTASH_REDIS_REST_URL/TOKEN in the test env, so every test here
// exercises the in-memory fallback path — which is also what a
// single-instance deployment (or local dev) actually uses.
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit (in-memory fallback)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", async () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const result = await checkRateLimit(key, 3, 1000);
      expect(result.ok).toBe(true);
    }
  });

  it("blocks the request once the limit is exceeded", async () => {
    const key = `test:${Math.random()}`;
    await checkRateLimit(key, 2, 1000);
    await checkRateLimit(key, 2, 1000);
    const third = await checkRateLimit(key, 2, 1000);
    expect(third.ok).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets the count after the window elapses", async () => {
    const key = `test:${Math.random()}`;
    await checkRateLimit(key, 1, 1000);
    const blocked = await checkRateLimit(key, 1, 1000);
    expect(blocked.ok).toBe(false);

    vi.advanceTimersByTime(1001);

    const afterReset = await checkRateLimit(key, 1, 1000);
    expect(afterReset.ok).toBe(true);
  });

  it("tracks separate keys independently", async () => {
    const keyA = `test:a:${Math.random()}`;
    const keyB = `test:b:${Math.random()}`;
    await checkRateLimit(keyA, 1, 1000);
    const blockedA = await checkRateLimit(keyA, 1, 1000);
    const okB = await checkRateLimit(keyB, 1, 1000);

    expect(blockedA.ok).toBe(false);
    expect(okB.ok).toBe(true);
  });

  it("decrements remaining correctly across calls", async () => {
    const key = `test:${Math.random()}`;
    const first = await checkRateLimit(key, 5, 1000);
    const second = await checkRateLimit(key, 5, 1000);
    expect(first.remaining).toBe(4);
    expect(second.remaining).toBe(3);
  });
});
