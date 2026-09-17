import { z } from "zod";
import { apiError, apiOk, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit } from "@/core/clients/rate-limit";
import { createClient, getUser } from "@/core/clients/supabase-server";
import { askAniverse } from "@/features/ai-companion/ai.service";

const askSchema = z.object({
  prompt: z.string().trim().min(2, "Please provide a question or recommendation criteria").max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .optional(),
});

export const POST = withApiHandler(async (req: Request) => {
  const user = await getUser();
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "anon";
  const rateKey = user ? `ai-ask:${user.id}` : `ai-ask:ip:${clientIp}`;

  // 15 AI queries per minute
  const rate = await checkRateLimit(rateKey, 15, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many AI requests. Please slow down.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid query", 400, "VALIDATION_ERROR");
  }

  const userWatchlistMalIds = new Set<number>();
  if (user) {
    const supabase = createClient();
    const { data: library } = await supabase
      .from("user_anime")
      .select("mal_id")
      .eq("user_id", user.id);

    if (library) {
      for (const item of library) {
        userWatchlistMalIds.add(item.mal_id);
      }
    }
  }

  const result = await askAniverse(parsed.data.prompt, userWatchlistMalIds, parsed.data.history || []);

  return apiOk(result);
});
