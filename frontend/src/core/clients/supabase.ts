import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Creates a Supabase client for use in client components and browser hooks.
 * Relies exclusively on NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Privileged keys (e.g. service role) are NEVER exposed here.
 */
export function createClient() {
  if (typeof window !== "undefined" && browserClient) {
    return browserClient;
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "mock-anon-key-00000000000000000000";

  const client = createBrowserClient(url, anonKey);

  if (typeof window !== "undefined") {
    browserClient = client;
  }

  return client;
}
