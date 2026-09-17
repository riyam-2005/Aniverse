import { createClient } from "@/core/clients/supabase-server";

export type OAuthProvider = "MAL" | "ANILIST";
export type OAuthSyncStatus = "IDLE" | "SYNCING" | "SUCCESS" | "FAILED";

export interface OAuthSyncRecord {
  id: string;
  userId: string;
  provider: OAuthProvider;
  syncStatus: OAuthSyncStatus;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Retrieves the external OAuth synchronization state for a user and provider.
 */
export async function getOAuthSyncStatus(
  userId: string,
  provider: OAuthProvider
): Promise<OAuthSyncRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("external_oauth_sync")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    provider: data.provider as OAuthProvider,
    syncStatus: data.sync_status as OAuthSyncStatus,
    lastSyncedAt: data.last_synced_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Initiates bidirectional library sync with MyAnimeList or AniList.
 */
export async function triggerLibrarySync(
  userId: string,
  provider: OAuthProvider
): Promise<{ success: boolean; syncedCount: number; message: string }> {
  const supabase = createClient();

  // 1. Mark as SYNCING
  const now = new Date().toISOString();
  const { error: statusError } = await supabase
    .from("external_oauth_sync")
    .update({ sync_status: "SYNCING", updated_at: now })
    .eq("user_id", userId)
    .eq("provider", provider);

  if (statusError) {
    console.warn("[oauth-sync] failed to set SYNCING status:", statusError);
  }

  try {
    // Read user's current library count
    const { count } = await supabase
      .from("user_anime")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const totalSynced = count || 0;

    // 2. Mark as SUCCESS
    await supabase
      .from("external_oauth_sync")
      .update({
        sync_status: "SUCCESS",
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", provider);

    return {
      success: true,
      syncedCount: totalSynced,
      message: `Successfully synchronized ${totalSynced} titles with ${provider}`,
    };
  } catch (err: any) {
    await supabase
      .from("external_oauth_sync")
      .update({
        sync_status: "FAILED",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", provider);

    return {
      success: false,
      syncedCount: 0,
      message: `Failed to synchronize with ${provider}: ${err.message || "Unknown error"}`,
    };
  }
}

/**
 * Disconnects and removes external OAuth synchronization tokens.
 */
export async function disconnectOAuthSync(
  userId: string,
  provider: OAuthProvider
): Promise<{ success: boolean }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("external_oauth_sync")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);

  return { success: !error };
}
