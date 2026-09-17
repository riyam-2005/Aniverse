import { describe, expect, it, vi, beforeEach } from "vitest";
import { getOAuthSyncStatus, triggerLibrarySync, disconnectOAuthSync } from "@/core/clients/oauth-sync";

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/core/clients/supabase-server", () => ({
  createClient: () => ({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "external_oauth_sync") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: mockSelect,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: mockUpdate,
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: mockDelete,
            }),
          }),
        };
      }
      if (table === "user_anime") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ count: 42, error: null }),
          }),
        };
      }
      return {};
    }),
  }),
}));

describe("Two-Way OAuth Sync Module (V2.3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves current sync record for a given provider", async () => {
    mockSelect.mockResolvedValue({
      data: {
        id: "sync-1",
        user_id: "user-123",
        provider: "MAL",
        sync_status: "SUCCESS",
        last_synced_at: "2026-09-17T00:00:00Z",
        created_at: "2026-09-17T00:00:00Z",
        updated_at: "2026-09-17T00:00:00Z",
      },
      error: null,
    });

    const status = await getOAuthSyncStatus("user-123", "MAL");
    expect(status).not.toBeNull();
    expect(status?.provider).toBe("MAL");
    expect(status?.syncStatus).toBe("SUCCESS");
  });

  it("executes library synchronization and updates state", async () => {
    mockUpdate.mockResolvedValue({ error: null });

    const result = await triggerLibrarySync("user-123", "MAL");
    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(42);
    expect(result.message).toContain("Successfully synchronized 42 titles with MAL");
  });

  it("disconnects OAuth sync account cleanly", async () => {
    mockDelete.mockResolvedValue({ error: null });

    const result = await disconnectOAuthSync("user-123", "ANILIST");
    expect(result.success).toBe(true);
  });
});
