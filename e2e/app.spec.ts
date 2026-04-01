import { expect, test } from "@playwright/test";

test.describe("SOTA Peak Finder - Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sota-peak-finder/");
  });

  test("page title is correct", async ({ page }) => {
    await expect(page).toHaveTitle(/SOTA Peak Finder/);
  });

  test("header navigation is visible", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(
      page.locator("text=SOTA Peak Finder").or(page.locator("text=SOTA ピークファインダー")),
    ).toBeVisible();
  });

  test("dashboard stats cards are displayed", async ({ page }) => {
    // Wait for stats to load
    await expect(page.locator('[class*="card"]').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("footer links are displayed", async ({ page }) => {
    await expect(page.locator('a:has-text("JE1WFV")')).toBeVisible();
    const githubLink = page.locator('a[href="https://github.com/matsubo/sota-peak-finder"]');
    await expect(githubLink).toBeVisible();
  });
});

test.describe("SOTA Peak Finder - Nearby Page", () => {
  test("nearby page loads with geolocation", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 35.6895, longitude: 139.6917 });
    await page.goto("/sota-peak-finder/nearby");

    // Page should load - check for header or any page content
    await expect(page.locator("header")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("SOTA Peak Finder - Summit Detail Page", () => {
  test("summit page loads for known summit", async ({ page }) => {
    await page.goto("/sota-peak-finder/summit/ja-so-001");

    // Should load the page - header is always present
    await expect(page.locator("header")).toBeVisible({ timeout: 15000 });

    // URL should be correct
    await expect(page).toHaveURL(/\/summit\/ja-so-001/);
  });
});

test.describe("SOTA Peak Finder - Summits List Page", () => {
  test("summits list page loads", async ({ page }) => {
    await page.goto("/sota-peak-finder/summits");

    // Should show summit list or filters
    await expect(
      page.locator("text=Summits").or(page.locator("text=山頂一覧")).first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("SOTA Peak Finder - Bookmarks Page", () => {
  test("bookmarks page loads", async ({ page }) => {
    await page.goto("/sota-peak-finder/bookmarks");

    // Should show bookmarks page content
    await expect(
      page.locator("text=Bookmarks").or(page.locator("text=ブックマーク")).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
