import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/mailer";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export const POST = withApiHandler(async (req: Request) => {
  // 5 requests per IP per 15 minutes — this endpoint sends email and hits
  // the DB, so it needs its own limit independent of login/register.
  const rate = await checkRateLimit(`forgot-password:${getClientIp(req)}`, 5, 15 * 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many attempts. Please try again later.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way whether or not the account exists —
  // otherwise this endpoint becomes a way to enumerate registered emails.
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const origin = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return apiOk({ message: "If that email has an account, we've sent a reset link." });
});
