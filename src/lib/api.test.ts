import { afterEach, describe, expect, it, vi } from "vitest";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { apiError, apiOk, handleApiError, readJson, withApiHandler } from "./api";

describe("apiOk / apiError", () => {
  it("apiOk returns a 200 JSON response with the given data", async () => {
    const res = apiOk({ hello: "world" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hello: "world" });
  });

  it("apiOk respects a custom status", async () => {
    const res = apiOk({ id: "1" }, 201);
    expect(res.status).toBe(201);
  });

  it("apiError returns the message, status, and code", async () => {
    const res = apiError("Nope", 403, "FORBIDDEN");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Nope", code: "FORBIDDEN" });
  });

  it("apiOk defaults to no Cache-Control header when not requested", () => {
    const res = apiOk({ id: "1" });
    expect(res.headers.get("Cache-Control")).toBeNull();
  });

  it("apiOk sets a public Cache-Control with SWR by default", () => {
    const res = apiOk({ id: "1" }, 200, { maxAge: 30 });
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=30, stale-while-revalidate=120"
    );
  });

  it("apiOk supports a private scope for personalized responses", () => {
    const res = apiOk({ id: "1" }, 200, { maxAge: 10, scope: "private" });
    expect(res.headers.get("Cache-Control")).toBe(
      "private, max-age=10, stale-while-revalidate=40"
    );
  });
});

describe("handleApiError", () => {
  it("maps ZodError to a 400 with the first issue's message", async () => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);

    const err = (result as { success: false; error: ZodError }).error;
    const res = handleApiError(err);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("maps Prisma unique constraint violations (P2002) to 409", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.20.0",
    });
    const res = handleApiError(err);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("DUPLICATE");
  });

  it("maps Prisma not-found errors (P2025) to 404", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "5.20.0",
    });
    const res = handleApiError(err);
    expect(res.status).toBe(404);
  });

  it("maps unrecognized Prisma error codes to a generic 500 without leaking details", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Some internal detail", {
      code: "P9999",
      clientVersion: "5.20.0",
    });
    const res = handleApiError(err);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).not.toContain("Some internal detail");
  });

  it("maps unknown errors to a generic 500 and logs server-side only", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = handleApiError(new Error("db connection string leaked here"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).not.toContain("db connection string leaked here");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("readJson", () => {
  it("parses a valid JSON body", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    });
    await expect(readJson(req)).resolves.toEqual({ a: 1 });
  });

  it("returns null instead of throwing on malformed JSON", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      body: "{not valid json",
    });
    await expect(readJson(req)).resolves.toBeNull();
  });
});

describe("withApiHandler — origin check on state-changing requests", () => {
  const okHandler = withApiHandler(async () => apiOk({ ok: true }));
  const ORIGINAL_NEXTAUTH_URL = process.env.NEXTAUTH_URL;

  afterEach(() => {
    process.env.NEXTAUTH_URL = ORIGINAL_NEXTAUTH_URL;
  });

  it("allows a same-origin POST", async () => {
    process.env.NEXTAUTH_URL = "https://aniverse.example";
    const req = new Request("https://aniverse.example/api/watchlist", {
      method: "POST",
      headers: { origin: "https://aniverse.example" },
    });
    const res = await okHandler(req);
    expect(res.status).toBe(200);
  });

  it("blocks a cross-origin POST", async () => {
    process.env.NEXTAUTH_URL = "https://aniverse.example";
    const req = new Request("https://aniverse.example/api/watchlist", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    const res = await okHandler(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("ORIGIN_MISMATCH");
  });

  it("allows a POST with no Origin header at all (defense-in-depth, not the only layer)", async () => {
    process.env.NEXTAUTH_URL = "https://aniverse.example";
    const req = new Request("https://aniverse.example/api/watchlist", { method: "POST" });
    const res = await okHandler(req);
    expect(res.status).toBe(200);
  });

  it("never checks Origin on safe methods like GET", async () => {
    process.env.NEXTAUTH_URL = "https://aniverse.example";
    const req = new Request("https://aniverse.example/api/watchlist", {
      method: "GET",
      headers: { origin: "https://evil.example" },
    });
    const res = await okHandler(req);
    expect(res.status).toBe(200);
  });

  it("always trusts localhost:3000 for local dev regardless of NEXTAUTH_URL", async () => {
    process.env.NEXTAUTH_URL = "https://aniverse.example";
    const req = new Request("http://localhost:3000/api/watchlist", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    const res = await okHandler(req);
    expect(res.status).toBe(200);
  });
});
