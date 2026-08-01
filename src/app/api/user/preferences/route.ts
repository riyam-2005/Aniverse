import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  genreIds: z.array(z.number().int().positive()).max(20),
});

/**
 * PATCH /api/user/preferences
 * Saves the genres picked during onboarding, used to seed recommendations
 * for users whose watchlist is still empty. Genres are stored as a plain
 * comma-separated string (see the field comment in schema.prisma for why).
 */
export const PATCH = withApiHandler(async (req) => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Not signed in.", 401);

  // 20 preference saves per user per 10 minutes — generous for a settings
  // form (even repeated edits while onboarding), enough to stop a script
  // from hammering this write.
  const rate = await checkRateLimit(`preferences:${userId}`, 20, 10 * 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down a bit.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { preferredGenres: parsed.data.genreIds.join(",") },
  });

  return apiOk({ ok: true });
});
