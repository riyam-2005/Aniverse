import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required").optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, "SUPABASE_SERVICE_ROLE_KEY is required for server admin tasks").optional(),
  OPENAI_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().or(z.literal("")).optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().or(z.literal("")).optional(),
  ADMIN_EMAILS: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
}).refine(
  (env) => {
    const hasUrl = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_URL.trim());
    const hasToken = Boolean(env.UPSTASH_REDIS_REST_TOKEN && env.UPSTASH_REDIS_REST_TOKEN.trim());
    return hasUrl === hasToken;
  },
  {
    message:
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together (or both left unset to use in-memory cache)",
    path: ["UPSTASH_REDIS_REST_URL"],
  }
);

/**
 * Validates required environment variables once at startup.
 */
export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    const report = `Invalid environment configuration:\n${messages.join("\n")}\n\nCheck your .env file against .env.example.`;

    if (process.env.NODE_ENV === "production") {
      throw new Error(report);
    }
    console.warn(`\n⚠️  ${report}\n`);
  }
}
