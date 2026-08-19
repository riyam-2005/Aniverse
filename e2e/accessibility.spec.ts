import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility checks via axe-core, run against real rendered
 * pages (not component snapshots) so they catch issues that only show up
 * in the full DOM — missing labels, color-contrast, landmark structure,
 * etc.
 *
 * Scoped to pages that render without live Jikan data, on purpose — the
 * same reasoning as e2e/register-login-watchlist.spec.ts: home/trending/
 * genres/anime-detail fetch from the real third-party Jikan API server-side,
 * and a11y pass/fail for a PR shouldn't hinge on that API's uptime. These
 * pages (auth, legal, 404) are fully self-contained and still cover the
 * most reused UI: forms, nav, footer, and error states.
 *
 * "Best practice" rules (axe's `best-practice` tag) are excluded — those
 * are opinionated recommendations, not WCAG failures, and would make this
 * suite flag things that aren't actually accessibility bugs.
 */

const PAGES = ["/login", "/register", "/forgot-password", "/terms", "/privacy"];

test.describe("accessibility (axe)", () => {
  for (const path of PAGES) {
    test(`${path} has no detectable WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(
        results.violations,
        `Accessibility violations on ${path}:\n${JSON.stringify(results.violations, null, 2)}`
      ).toEqual([]);
    });
  }

  test("a route that triggers a 404 has no detectable WCAG A/AA violations", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-e2e");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      `Accessibility violations on the 404 page:\n${JSON.stringify(results.violations, null, 2)}`
    ).toEqual([]);
  });
});
