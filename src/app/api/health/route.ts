import { prisma } from "@/lib/prisma";
import { apiOk } from "@/lib/api";
import { getJikanHealth } from "@/lib/jikan";

// Deliberately never throws a 500 here: monitoring should always get a
// 200 with a detailed body it can inspect, so uptime checks can tell
// "our DB is down" apart from "Jikan is down" apart from "everything's
// fine" instead of collapsing every failure mode into one alert.
export async function GET() {
  const startedAt = Date.now();

  const [dbResult, jikan] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    getJikanHealth(),
  ]);

  const db =
    dbResult.status === "fulfilled"
      ? { status: "ok" as const }
      : { status: "down" as const, error: String(dbResult.reason) };

  const jikanHealth =
    jikan.status === "fulfilled"
      ? jikan.value
      : { status: "down" as const, failures: 0, circuitOpen: false, backend: "memory" as const };

  const overall =
    db.status === "ok" && jikanHealth.status !== "down" ? "ok" : "degraded";

  // Process-level metrics — only meaningful on a long-lived Node server
  // (not on Vercel's stateless functions, where each invocation is a fresh
  // process), but harmless and useful in that case, and free to compute.
  const process_ = {
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  };

  return apiOk(
    {
      status: overall,
      checks: { db, jikan: jikanHealth },
      process: process_,
      responseTimeMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    },
    overall === "ok" ? 200 : 200 // keep 200 so external monitors always get a body to parse; use `status` field for alerting
  );
}
