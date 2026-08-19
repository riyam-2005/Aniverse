import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, withApiHandler } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = withApiHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("You need to sign in to react to reviews.", 401);

  const rate = await checkRateLimit(`review-like:${userId}`, 40, 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many requests. Slow down.", 429, "RATE_LIMITED");
  }

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return apiError("Review not found", 404);

  // Return success toggle response
  return apiOk({ liked: true, reviewId: params.id });
});
