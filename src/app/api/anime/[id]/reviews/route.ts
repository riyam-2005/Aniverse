import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

const upsertSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 10").max(10, "Rating must be between 1 and 10"),
  body: z.string().trim().max(2000, "Review is too long (max 2000 characters)").optional(),
});

export function generateStaticParams() {
  return [{ id: "1" }];
}

export const GET = withApiHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const animeMalId = Number(params.id);
  if (!Number.isFinite(animeMalId)) {
    return apiError("Invalid anime id", 400, "VALIDATION_ERROR");
  }

  const [reviews, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { animeMalId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.review.aggregate({
      where: { animeMalId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return apiOk(
    {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: { id: r.user.id, name: r.user.name },
      })),
      average: aggregate._avg.rating,
      count: aggregate._count.rating,
    },
    200,
    { maxAge: 30, scope: "public" }
  );
});

export const POST = withApiHandler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const animeMalId = Number(params.id);
    if (!Number.isFinite(animeMalId)) {
      return apiError("Invalid anime id", 400, "VALIDATION_ERROR");
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return apiError("You need to sign in to leave a review.", 401, "UNAUTHENTICATED");
    }

    const rate = await checkRateLimit(`review:${userId}`, 20, 10 * 60 * 1000);
    if (!rate.ok) {
      return apiError("You're doing that too fast. Please slow down.", 429, "RATE_LIMITED");
    }

    const body = await readJson(req);
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
    }

    const review = await prisma.review.upsert({
      where: { userId_animeMalId: { userId, animeMalId } },
      create: {
        animeMalId,
        userId,
        rating: parsed.data.rating,
        body: parsed.data.body || null,
      },
      update: {
        rating: parsed.data.rating,
        body: parsed.data.body || null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return apiOk({
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: { id: review.user.id, name: review.user.name },
    });
  }
);

export const DELETE = withApiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const animeMalId = Number(params.id);
    if (!Number.isFinite(animeMalId)) {
      return apiError("Invalid anime id", 400, "VALIDATION_ERROR");
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return apiError("Not signed in", 401, "UNAUTHENTICATED");
    }

    await prisma.review.deleteMany({ where: { userId, animeMalId } });
    return apiOk({ ok: true });
  }
);
