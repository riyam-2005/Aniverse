import { z } from "zod";
import { apiOk, apiError, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit, getClientIp } from "@/core/clients/rate-limit";
import { createClient } from "@/core/clients/supabase-server";

const schema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const POST = withApiHandler(async (req: Request) => {
  const rate = await checkRateLimit(`reset-password:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many attempts. Please try again later.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return apiError(error.message, 400);
  }

  return apiOk({ message: "Password updated successfully. You can now sign in." });
});
