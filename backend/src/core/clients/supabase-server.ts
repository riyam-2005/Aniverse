import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates an authenticated Supabase client for Server Components,
 * Server Actions, and Route Handlers with automatic cookie sync.
 */
export function createClient() {
  const cookieStore = cookies();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "mock-anon-key-00000000000000000000";

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieStore.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // The `remove` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Retrieves the currently authenticated Supabase user safely on the server.
 * Returns null if the user is unauthenticated or session has expired.
 */
export async function getUser() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current user's profile from the `profiles` table.
 */
export async function getProfile(userId?: string) {
  try {
    const supabase = createClient();
    const targetId = userId ?? (await getUser())?.id;
    if (!targetId) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetId)
      .single();

    if (error || !profile) return null;
    return profile;
  } catch {
    return null;
  }
}
