import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Admin Client using the Supabase Service Role Key.
 *
 * CRITICAL SECURITY INSTRUCTION:
 * - This file and `SUPABASE_SERVICE_ROLE_KEY` must ONLY ever be imported
 *   and used in secure server-side environments (cron jobs, administrative endpoints).
 * - NEVER import or execute this on the client / browser side.
 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
