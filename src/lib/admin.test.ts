import { afterEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique } },
}));

const { isAdmin, isAdminEmail } = await import("./admin");

const ORIGINAL_ADMIN_EMAILS = process.env.ADMIN_EMAILS;

afterEach(() => {
  if (ORIGINAL_ADMIN_EMAILS === undefined) {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = ORIGINAL_ADMIN_EMAILS;
  }
  findUnique.mockReset();
});

describe("isAdminEmail", () => {
  it("returns false when ADMIN_EMAILS is unset", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail("owner@example.com")).toBe(false);
  });

  it("returns false when ADMIN_EMAILS is an empty string", () => {
    process.env.ADMIN_EMAILS = "";
    expect(isAdminEmail("owner@example.com")).toBe(false);
  });

  it("returns true for an email in the allowlist", () => {
    process.env.ADMIN_EMAILS = "owner@example.com, other@example.com";
    expect(isAdminEmail("owner@example.com")).toBe(true);
  });

  it("matches case-insensitively and trims whitespace", () => {
    process.env.ADMIN_EMAILS = "  Owner@Example.com ";
    expect(isAdminEmail("owner@example.com")).toBe(true);
  });

  it("returns false for an email not in the allowlist", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    expect(isAdminEmail("random@example.com")).toBe(false);
  });

  it("returns false for null/undefined input", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns false for null/undefined without touching the DB", async () => {
    expect(await isAdmin(null)).toBe(false);
    expect(await isAdmin(undefined)).toBe(false);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("short-circuits on the env allowlist without a DB lookup", async () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    expect(await isAdmin("owner@example.com")).toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("falls back to the DB role when not on the allowlist", async () => {
    delete process.env.ADMIN_EMAILS;
    findUnique.mockResolvedValue({ role: "ADMIN" });
    expect(await isAdmin("db-admin@example.com")).toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: "db-admin@example.com" },
      select: { role: true },
    });
  });

  it("returns false for a regular user role", async () => {
    delete process.env.ADMIN_EMAILS;
    findUnique.mockResolvedValue({ role: "USER" });
    expect(await isAdmin("someone@example.com")).toBe(false);
  });

  it("returns false when the user doesn't exist", async () => {
    delete process.env.ADMIN_EMAILS;
    findUnique.mockResolvedValue(null);
    expect(await isAdmin("nobody@example.com")).toBe(false);
  });
});
