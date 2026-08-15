import { type ConsoleMessage, expect, type Page, test } from "@playwright/test";

/**
 * Guards against the failure mode the shell-level specs cannot see: the app
 * renders its chrome perfectly while no summit data loads at all.
 *
 * A stale public/wasm/sqlite3.wasm once made SotaDatabase.init() throw on every
 * page load — zero summits anywhere — and the entire suite still passed, because
 * every assertion targeted headers and URLs. These tests assert on data, and
 * fail on console errors, so that class of regression cannot ship silently.
 */

const SUMMIT_REF = /[A-Z0-9]{1,3}\/[A-Z]{2}-\d{3,4}/;

/** Collects console errors and uncaught exceptions for the lifetime of a page. */
function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err: Error) => {
    errors.push(`pageerror: ${err.message}`);
  });
  return errors;
}

test.describe("Summit data actually loads", () => {
  test("dashboard reports a realistic worldwide summit count", async ({ page }) => {
    await page.goto("/sota-peak-finder/");

    // The dashboard falls back to "0" whenever the database fails to initialise,
    // so a real count here is what proves SQLite loaded and queried successfully.
    const total = page.getByTestId("total-summits-value");
    await expect(total).toBeVisible({ timeout: 30000 });

    const parsed = Number((await total.innerText()).replace(/,/g, ""));
    expect(parsed).toBeGreaterThan(100000);
  });

  test("summits list renders real summit references", async ({ page }) => {
    await page.goto("/sota-peak-finder/summits");

    const firstRef = page.getByText(SUMMIT_REF).first();
    await expect(firstRef).toBeVisible({ timeout: 30000 });
    expect(await firstRef.innerText()).toMatch(SUMMIT_REF);
  });

  test("summit detail page renders that summit's own data", async ({ page }) => {
    await page.goto("/sota-peak-finder/summit/ja-so-001");

    await expect(page.getByText("JA/SO-001").first()).toBeVisible({ timeout: 30000 });
    // Altitude is read straight from the database, so its presence means the
    // row was found rather than the page merely rendering its skeleton.
    await expect(page.getByText(/\d+\s*m/).first()).toBeVisible({ timeout: 30000 });
  });
});

test.describe("Pages load without console errors", () => {
  for (const route of [
    "/sota-peak-finder/",
    "/sota-peak-finder/summits",
    "/sota-peak-finder/bookmarks",
    // Exercises the widest set of external hosts -- map tiles, weather and the
    // SOTA APIs -- so it is what actually validates the Content-Security-Policy.
    "/sota-peak-finder/summit/ja-so-001",
  ]) {
    test(`no console errors on ${route}`, async ({ page }) => {
      const errors = collectPageErrors(page);

      await page.goto(route);
      await expect(page.locator("header")).toBeVisible({ timeout: 30000 });
      await page.waitForLoadState("networkidle");

      expect(errors, `Unexpected console output on ${route}:\n${errors.join("\n")}`).toEqual([]);
    });
  }
});
