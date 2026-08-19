import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { phoneLoginConfigured, verifyFirebasePhoneToken } from "@/lib/firebaseAdmin";

const schema = z.object({
  idToken: z.string().trim().min(1, "Missing verification token"),
});

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

/**
 * Confirms the Firebase ID token the client got back from
 * useFirebasePhoneAuth's confirmCode() and, if it checks out, links the
 * verified phone number to the signed-in user so it can be used for phone
 * sign-in from then on.
 */
export const POST = withApiHandler(async (req: Request) => {
  if (!phoneLoginConfigured()) {
    return apiError("Phone sign-in isn't enabled on this site.", 503, "NOT_CONFIGURED");
  }

  const userId = await requireUserId();
  if (!userId) {
    return apiError("Not signed in", 401, "UNAUTHENTICATED");
  }

  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const rate = await checkRateLimit(`phone-verify:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many attempts. Please try again later.", 429, "RATE_LIMITED");
  }

  const phone = await verifyFirebasePhoneToken(parsed.data.idToken);
  if (!phone) {
    return apiError("That verification could not be confirmed. Try again.", 400, "INVALID_TOKEN");
  }

  const existing = await prisma.user.findFirst({
    where: { phone, phoneVerifiedAt: { not: null }, id: { not: userId } },
  });
  if (existing) {
    return apiError("That phone number is already linked to another account.", 409, "PHONE_TAKEN");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { phone, phoneVerifiedAt: new Date() },
  });

  return apiOk({ message: "Phone number verified and linked.", phone });
});

/** Unlinks the phone number from the signed-in user (disables phone sign-in for them). */
export const DELETE = withApiHandler(async () => {
  const userId = await requireUserId();
  if (!userId) {
    return apiError("Not signed in", 401, "UNAUTHENTICATED");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { phone: null, phoneVerifiedAt: null },
  });

  return apiOk({ message: "Phone number removed." });
});
