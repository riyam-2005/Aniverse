import { describe, expect, it, vi, beforeEach } from "vitest";
import { updateEpisodeProgress } from "./watchlist";

const mockRevalidateTag = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (...args: any[]) => mockRevalidateTag(...args),
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

let mockUser: { id: string } | null = { id: "user-123" };
const mockUpdate = vi.fn().mockReturnValue({ match: vi.fn().mockResolvedValue({ error: null }) });
const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/core/clients/supabase-server", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockImplementation(() => Promise.resolve({ data: { user: mockUser } })),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "user_anime") {
        return { update: mockUpdate };
      }
      if (table === "watch_history") {
        return { insert: mockInsert };
      }
      return {};
    }),
  }),
}));

describe("updateEpisodeProgress Server Action (Blueprint 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-123" };
  });

  it("throws Unauthorized error when user is not authenticated", async () => {
    mockUser = null;
    await expect(updateEpisodeProgress(16498, 5)).rejects.toThrow("Unauthorized");
  });

  it("executes atomic dual-write to user_anime and watch_history", async () => {
    const result = await updateEpisodeProgress(16498, 5);

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ episodes_watched: 5 })
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-123",
        mal_id: 16498,
        episode_number: 5,
      })
    );
  });

  it("triggers targeted cache purges for user watchlist, library, and history", async () => {
    await updateEpisodeProgress(16498, 5);

    expect(mockRevalidateTag).toHaveBeenCalledWith("user-watchlist-user-123");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/library");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/history");
  });
});
