import { getAdminClient } from "@/core/clients/supabase-admin";

/**
 * Checks if an email is in the admin allowlist environment variable.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) return false;

  return allowlist.includes(email.trim().toLowerCase());
}

/**
 * Full admin check: env allowlist first, then the `profiles.role` column in Supabase.
 */
export async function isAdmin(userIdOrEmail: string | null | undefined): Promise<boolean> {
  if (!userIdOrEmail) return false;

  if (isAdminEmail(userIdOrEmail)) return true;

  try {
    const supabase = getAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .or(`id.eq.${userIdOrEmail},username.eq.${userIdOrEmail}`)
      .single();

    return profile?.role === "ADMIN";
  } catch {
    return false;
  }
}

/**
 * Persists an immutable audit log entry for moderation and admin actions.
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  targetSummary,
  details,
}: {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetSummary?: string;
  details?: string;
}) {
  try {
    const adminSupabase = getAdminClient();
    return await adminSupabase.from("admin_logs").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      target_summary: targetSummary,
      details,
    });
  } catch (err) {
    console.error("[admin] Failed to write audit log:", err);
  }
}
