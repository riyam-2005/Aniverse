import { z } from "zod";
import { apiError, apiOk, readJson, withApiHandler } from "@/core/utils/api";
import { checkRateLimit, getClientIp } from "@/core/clients/rate-limit";
import { createClient } from "@/core/clients/supabase-server";

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
    .max(72, "Password is too long")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const POST = withApiHandler(async (req: Request) => {
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
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name,
        username: email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase(),
      },
    },
  });

  if (error) {
    return apiError(error.message, 400, "AUTH_ERROR");
  }

  return apiOk({ id: data.user?.id, email: data.user?.email }, 201);
});
