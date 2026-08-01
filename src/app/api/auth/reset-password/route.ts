import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1, "Missing reset token"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long") // bcrypt silently truncates beyond 72 bytes
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const POST = withApiHandler(async (req: Request) => {
  // 10 attempts per IP per 15 minutes — generous enough for a mistyped
  // password, tight enough to slow down token brute-forcing.
  const rate = await checkRateLimit(`reset-password:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many attempts. Please try again later.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const { token, password } = parsed.data;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return apiError("This reset link is invalid or has expired.", 400, "INVALID_TOKEN");
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return apiOk({ message: "Password updated. You can now sign in." });
});
