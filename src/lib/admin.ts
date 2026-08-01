import { prisma } from "@/lib/prisma";

/**
 * Minimal admin gate for the /admin dashboards (analytics + monitoring).
 *
 * Two layers, checked in order by `isAdmin` below:
 *  1. `ADMIN_EMAILS` — an env allowlist. This exists as a bootstrap
 *     mechanism: on a fresh deploy there's no admin user yet, and without
 *     this you'd need direct DB access just to grant the first one.
 *  2. `User.role === "ADMIN"` — the real, durable mechanism. Granting it
 *     today is a direct DB write (`UPDATE "User" SET role = 'ADMIN' WHERE
 *     email = '...'`, or the same via `npx prisma studio`) rather than a
 *     self-serve UI — that's its own auth surface to get right, and isn't
 *     worth building until there's more than one admin to manage. See the
 *     README for the exact command.
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

/** Full admin check: env allowlist first (cheap, no DB round-trip), then
 *  the durable `User.role` column. */
export async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (isAdminEmail(email)) return true;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}
