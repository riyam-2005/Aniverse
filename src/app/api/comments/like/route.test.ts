import { afterEach, describe, expect, it, vi } from "vitest";

// This is the first route-level test in the project (existing coverage is
// all src/lib/*.test.ts). Mocks follow the same style as src/lib/admin.test.ts —
// mock the module, then dynamically import the route so the mock is in
// place before it's evaluated.

const getServerSession = vi.fn();
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const findUnique = vi.fn();
const commentLikeFindUnique = vi.fn();
const commentLikeDelete = vi.fn();
const commentLikeCreate = vi.fn();
const commentLikeCount = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    comment: { findUnique },
    commentLike: {
      findUnique: commentLikeFindUnique,
      delete: commentLikeDelete,
      create: commentLikeCreate,
      count: commentLikeCount,
    },
  },
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
    getServerSession.mockResolvedValue(null);
    const res = await POST(fakeRequest(), { params: { commentId: "c1" } });
    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 for a comment that doesn't exist", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    findUnique.mockResolvedValue(null);
    const res = await POST(fakeRequest(), { params: { commentId: "missing" } });
    expect(res.status).toBe(404);
  });

  it("likes a comment the user hasn't liked yet", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    findUnique.mockResolvedValue({ id: "c1" });
    commentLikeFindUnique.mockResolvedValue(null);
    commentLikeCount.mockResolvedValue(5);

    const res = await POST(fakeRequest(), { params: { commentId: "c1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ liked: true, likeCount: 5 });
    expect(commentLikeCreate).toHaveBeenCalledWith({
      data: { commentId: "c1", userId: "u1" },
    });
    expect(commentLikeDelete).not.toHaveBeenCalled();
  });

  it("un-likes a comment the user already liked", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    findUnique.mockResolvedValue({ id: "c1" });
    commentLikeFindUnique.mockResolvedValue({ id: "like1" });
    commentLikeCount.mockResolvedValue(4);

    const res = await POST(fakeRequest(), { params: { commentId: "c1" } });
    expect(await res.json()).toEqual({ liked: false, likeCount: 4 });
    expect(commentLikeDelete).toHaveBeenCalledWith({ where: { id: "like1" } });
    expect(commentLikeCreate).not.toHaveBeenCalled();
  });

  it("rate-limits after 60 toggles in a minute for the same user", async () => {
    getServerSession.mockResolvedValue({ user: { id: "rate-limit-test-user" } });
    findUnique.mockResolvedValue({ id: "c1" });
    commentLikeFindUnique.mockResolvedValue(null);
    commentLikeCount.mockResolvedValue(1);

    let lastStatus = 200;
    for (let i = 0; i < 61; i++) {
      const res = await POST(fakeRequest(), { params: { commentId: "c1" } });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
