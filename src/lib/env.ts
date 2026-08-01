import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET should be at least 32 characters — generate one with `openssl rand -base64 32`"),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  // Optional — comma-separated list of emails allowed into /admin
  // (analytics + monitoring dashboards). Leave unset to keep /admin closed
  // entirely, even to signed-in users.
  ADMIN_EMAILS: z.string().optional(),
}).refine(
  (env) => !!env.UPSTASH_REDIS_REST_URL === !!env.UPSTASH_REDIS_REST_TOKEN,
  {
    message:
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together (or both left unset to use the in-memory rate limiter)",
    path: ["UPSTASH_REDIS_REST_URL"],
  }
).refine(
  (env) => {
    const firebaseVals = [
      env.NEXT_PUBLIC_FIREBASE_API_KEY,
      env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      env.NEXT_PUBLIC_FIREBASE_APP_ID,
      env.FIREBASE_ADMIN_CLIENT_EMAIL,
      env.FIREBASE_ADMIN_PRIVATE_KEY,
    ];
    const setCount = firebaseVals.filter(Boolean).length;
    return setCount === 0 || setCount === firebaseVals.length;
  },
  {
    message:
      "NEXT_PUBLIC_FIREBASE_* and FIREBASE_ADMIN_* must all be set together (or all left unset to disable phone login)",
    path: ["NEXT_PUBLIC_FIREBASE_API_KEY"],
  }
);

/**
 * Validates required environment variables once, at server startup
 * (called from instrumentation.ts). Fails fast with a clear message
 * instead of letting a missing/weak secret cause confusing runtime
 * errors or, worse, a silent security hole in production.
 */
export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    const report = `Invalid environment configuration:\n${messages.join("\n")}\n\nCheck your .env file against .env.example.`;

    // In production this should hard-stop the server rather than run insecurely.
    if (process.env.NODE_ENV === "production") {
      throw new Error(report);
    }
    console.warn(`\n⚠️  ${report}\n`);
  }
}
