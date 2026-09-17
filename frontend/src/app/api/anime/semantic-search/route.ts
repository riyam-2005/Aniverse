import { z } from "zod";
import { apiError, apiOk, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { semanticSearchAnime } from "@/core/clients/vector-search";

const querySchema = z.object({
  q: z.string().trim().min(2, "Query must be at least 2 characters").max(250, "Query is too long"),
  limit: z.coerce.number().int().min(1).max(25).default(10),
  threshold: z.coerce.number().min(0).max(1).default(0.4),
});

export const GET = withApiHandler(async (req: Request) => {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? 10,
    threshold: url.searchParams.get("threshold") ?? 0.4,
  });

  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid search parameters", 400, "VALIDATION_ERROR");
  }

  const { q, limit, threshold } = parsed.data;

  // Rate limiting (30 requests per minute per IP)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rate = await checkRateLimit(`semantic-search:${clientIp}`, 30, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many search requests. Please slow down.", 429, "RATE_LIMITED");
  }

  const results = await semanticSearchAnime(q, { limit, threshold });

  return apiOk(
    {
      query: q,
      count: results.length,
      results,
    },
    200,
    { maxAge: 60, scope: "public" }
  );
});
