import { afterEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const singleMock = vi.fn();
const eqUserMock = vi.fn(() => ({ single: singleMock }));
const eqCommentMock = vi.fn(() => ({ eq: eqUserMock }));
const selectLikeMock = vi.fn(() => ({ eq: eqCommentMock }));

const insertMock = vi.fn().mockResolvedValue({ error: null });
const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
const deleteMock = vi.fn(() => ({ eq: deleteEqMock }));
const countEqMock = vi.fn().mockResolvedValue({ count: 5, error: null });
const countSelectMock = vi.fn(() => ({ eq: countEqMock }));
const updateEqMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn(() => ({ eq: updateEqMock }));

vi.mock("@/core/clients/supabase-server", () => ({
  getUser: () => getUserMock(),
  createClient: () => ({
    from: (table: string) => {
      if (table === "comment_likes") {
        return {
          select: (fields: string, opts?: any) => {
            if (opts?.count) return countSelectMock();
            return selectLikeMock();
          },
          insert: insertMock,
          delete: deleteMock,
        };
      }
      if (table === "comments") {
        return {
          update: updateMock,
        };
      }
      return {};
    },
  }),
}));

const { POST } = await import("./route");

function fakeRequest() {
  return new Request("http://localhost/api/comments/like/c1", { method: "POST" });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/comments/like/[commentId]", () => {
  it("rejects when not signed in", async () => {
    getUserMock.mockResolvedValue(null);
    const res = await POST(fakeRequest(), { params: { commentId: "c1" } });
    expect(res.status).toBe(401);
  });

  it("likes a comment when user has not liked it yet", async () => {
    getUserMock.mockResolvedValue({ id: "u1" });
    singleMock.mockResolvedValue({ data: null });
    countEqMock.mockResolvedValue({ count: 5 });

    const res = await POST(fakeRequest(), { params: { commentId: "c1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.liked).toBe(true);
    expect(insertMock).toHaveBeenCalled();
  });

  it("un-likes a comment when user has already liked it", async () => {
    getUserMock.mockResolvedValue({ id: "u1" });
    singleMock.mockResolvedValue({ data: { id: "like1" } });
    countEqMock.mockResolvedValue({ count: 4 });

    const res = await POST(fakeRequest(), { params: { commentId: "c1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.liked).toBe(false);
    expect(deleteMock).toHaveBeenCalled();
  });
});
