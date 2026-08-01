import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, readJson, withApiHandler } from "@/lib/api";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be under 60 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long") // bcrypt silently truncates beyond 72 bytes
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const POST = withApiHandler(async (req: Request) => {
  // 5 registration attempts per IP per 10 minutes — slows down bulk account creation.
  const rate = await checkRateLimit(`register:${getClientIp(req)}`, 5, 10 * 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many attempts. Please try again later.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("An account with that email already exists", 409, "DUPLICATE");
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  return apiOk({ id: user.id, email: user.email }, 201);
});
