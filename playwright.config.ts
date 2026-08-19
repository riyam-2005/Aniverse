import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config notes:
 *
 * - Runs against `next dev` on a dedicated port (4001) so it never collides
 *   with a dev server you might already have running on 3000.
 * - Uses its own SQLite file (e2e-test.db), reset by `pretest:e2e` before
 *   every run via `prisma db push --force-reset` — every run starts from a
 *   clean database, so tests can't pass/fail based on leftover state from a
 *   previous run.
 * - Deliberately does NOT depend on the live Jikan API. The anime-detail
 *   page fetches from Jikan server-side, which Playwright's browser-level
 *   request mocking can't intercept, and a third-party API's uptime is not
 *   something a CI suite should depend on. Instead, the watchlist part of
 *   the flow is exercised by calling our own /api/watchlist route directly
 *   (still through the real authenticated session) — see
 *   e2e/register-login-watchlist.spec.ts for the reasoning inline.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // tests share one SQLite file; keep them sequential
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:4001",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "next dev -p 4001",
    url: "http://localhost:4001",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      DATABASE_URL: "file:./e2e-test.db",
      NEXTAUTH_SECRET: "e2e-test-secret-not-for-production-use-000000",
      NEXTAUTH_URL: "http://localhost:4001",
    },
  },
});
