import { apiOk } from "@/core/utils/api";
import { getJikanHealth } from "@/core/clients/jikan";
import { createClient } from "@/core/clients/supabase-server";

export async function GET() {
  const startedAt = Date.now();

  const supabase = createClient();

  const [dbResult, jikan] = await Promise.allSettled([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    getJikanHealth(),
  ]);

  const db =
    dbResult.status === "fulfilled" && !dbResult.value.error
      ? { status: "ok" as const }
      : {
          status: "down" as const,
          error: dbResult.status === "rejected" ? String(dbResult.reason) : dbResult.value.error?.message,
        };

  const jikanHealth =
    jikan.status === "fulfilled"
      ? jikan.value
      : { status: "down" as const, failures: 0, circuitOpen: false, backend: "memory" as const };

  const overall =
    db.status === "ok" && jikanHealth.status !== "down" ? "ok" : "degraded";

  const processMetrics = {
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  };

  return apiOk(
    {
      status: overall,
      checks: { db, jikan: jikanHealth },
      process: processMetrics,
      responseTimeMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    },
    200
  );
}
