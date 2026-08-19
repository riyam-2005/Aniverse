import { test, expect } from "@playwright/test";

/**
 * Covers the core account + watchlist flow end-to-end against a real
 * running instance of the app (real Next.js server, real SQLite DB, real
 * NextAuth session — nothing mocked at the app layer).
 *
 * One deliberate exception: adding a title to the watchlist is done by
 * calling POST /api/watchlist directly instead of clicking through the
 * search → anime-detail → "Add to Watchlist" UI. That UI path renders data
 * fetched server-side from the live Jikan API, which Playwright can't stub
 * (Jikan is called from the Next.js server, not the browser, so
 * page.route() never sees it) and which we don't want this suite's
 * pass/fail to depend on anyway — a Jikan outage shouldn't turn into a
 * failing CI run for an unrelated PR. Hitting our own API directly still
 * exercises the real thing this test cares about: that a signed-in
 * session can create a watchlist item and see it persisted.
 */

function uniqueUser() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return {
    name: "E2E Test User",
    email: `e2e-${id}@example.com`,
    password: "TestPass123",
  };
}

test.describe("register → login → watchlist", () => {
  test("a new user can register, is signed in, and can add + see a watchlist item", async ({
    page,
  }) => {
    const user = uniqueUser();

    // --- Register ---
    await page.goto("/register");
    await page.getByLabel("Name").fill(user.name);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();

    // Registration signs the user in and redirects home.
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "My List" })).toBeVisible();

    // --- Add an item to the watchlist via the app's own API, using the
    // real authenticated browser session (cookies are shared automatically
    // by Playwright's request context) ---
    const addResponse = await page.request.post("/api/watchlist", {
      data: {
        malId: 1,
        title: "Cowboy Bebop",
        imageUrl: "https://example.com/cowboy-bebop.jpg",
        totalEpisodes: 26,
        status: "PLANNING",
      },
    });
    expect(addResponse.ok()).toBeTruthy();

    // --- See it show up on the watchlist page ---
    await page.goto("/watchlist");
    await expect(page.getByText("Cowboy Bebop")).toBeVisible();
    await expect(page.getByText("Plan to Watch")).toBeVisible();
  });

  test("signing out and back in preserves the watchlist", async ({ page }) => {
    const user = uniqueUser();

    await page.goto("/register");
    await page.getByLabel("Name").fill(user.name);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/");

    const addResponse = await page.request.post("/api/watchlist", {
      data: {
        malId: 2,
        title: "Mushishi",
        imageUrl: "https://example.com/mushishi.jpg",
        totalEpisodes: 26,
        status: "PLANNING",
      },
    });
    expect(addResponse.ok()).toBeTruthy();

    // Sign out.
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    // Sign back in with the same credentials.
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");

    // The watchlist item created before logout is still there.
    await page.goto("/watchlist");
    await expect(page.getByText("Mushishi")).toBeVisible();
  });

  test("a registered user cannot register again with the same email", async ({
    page,
  }) => {
    const user = uniqueUser();

    await page.goto("/register");
    await page.getByLabel("Name").fill(user.name);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("button", { name: "Sign out" }).click();

    await page.goto("/register");
    await page.getByLabel("Name").fill(user.name);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });
});
