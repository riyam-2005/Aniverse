import { z } from "zod";
import { apiOk, apiError, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit, getClientIp } from "@/core/clients/rate-limit";
import { createClient } from "@/core/clients/supabase-server";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const POST = withApiHandler(async (req: Request) => {
  const rate = await checkRateLimit(`forgot-password:${getClientIp(req)}`, 5, 15 * 60 * 1000);
  if (!rate.ok) {
    return apiError("Too many attempts. Please try again later.", 429, "RATE_LIMITED");
  }

  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400, "VALIDATION_ERROR");
  }

  const supabase = createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  return apiOk({ message: "If that email has an account, we've sent a reset link." });
});
