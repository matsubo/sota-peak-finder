import { test, expect } from '@playwright/test'

/**
 * Bookmark feature E2E tests.
 * Most tests use localStorage injection to avoid requiring the SOTA database.
 * Tests marked "requires DB" need `bun run setup` to download public/data/sota.db first.
 */

const BOOKMARK_KEY = 'sota-bookmarks'

const sampleBookmarks = {
  'JA/MN-001': { status: 'want_to_go', savedAt: '2026-02-21T10:00:00Z' },
  'JA/KN-001': { status: 'activated', savedAt: '2026-02-20T08:00:00Z' },
}

// The app is served with Vite base '/sota-peak-finder/' and BrowserRouter basename='/sota-peak-finder'
const BASE = '/sota-peak-finder'

test.describe('Bookmarks page', () => {
  test('shows empty state when no bookmarks', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.evaluate((key) => localStorage.removeItem(key), BOOKMARK_KEY)
    await page.goto(`${BASE}/bookmarks`)
    await expect(page.getByText(/no bookmarks yet/i)).toBeVisible()
  })

  test('shows bookmarked summits grouped by status', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.evaluate(
      ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
      { key: BOOKMARK_KEY, data: sampleBookmarks }
    )
    await page.goto(`${BASE}/bookmarks`)

    // Should show both status sections
    await expect(page.getByText(/want to go/i).first()).toBeVisible()
    await expect(page.getByText(/activated/i).first()).toBeVisible()

    // Should show the summit refs
    await expect(page.getByText('JA/MN-001').first()).toBeVisible()
    await expect(page.getByText('JA/KN-001').first()).toBeVisible()
  })

  test('removes a bookmark when remove button clicked', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.evaluate(
      ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
      { key: BOOKMARK_KEY, data: { 'JA/MN-001': { status: 'want_to_go', savedAt: '2026-02-21T10:00:00Z' } } }
    )

    await page.goto(`${BASE}/bookmarks`)
    await expect(page.getByText('JA/MN-001').first()).toBeVisible()

    // Click remove button (Trash2 icon button with aria-label "Remove")
    await page.getByRole('button', { name: /remove/i }).first().click()

    // Should show empty state
    await expect(page.getByText(/no bookmarks yet/i)).toBeVisible()
  })

  test('bookmark count shows correctly in page subtitle', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.evaluate(
      ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
      { key: BOOKMARK_KEY, data: sampleBookmarks }
    )
    await page.goto(`${BASE}/bookmarks`)

    // Should show count of 2 bookmarked
    await expect(page.getByText(/2 bookmarked/i)).toBeVisible()
  })
})

test.describe('Header bookmark badge', () => {
  test('bookmark icon visible in header', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.getByTitle(/bookmarks/i).first()).toBeVisible()
  })

  test('count badge appears when bookmarks exist', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.evaluate(
      ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
      { key: BOOKMARK_KEY, data: sampleBookmarks }
    )
    await page.reload()

    // Badge should show "2"
    const badge = page.locator('span').filter({ hasText: '2' }).first()
    await expect(badge).toBeVisible()
  })

  test('navigates to bookmarks page via header icon', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.getByTitle(/bookmarks/i).first().click()
    await expect(page).toHaveURL(/\/bookmarks/)
  })
})

test.describe('Bookmark persistence', () => {
  test('bookmarks persist across page reloads', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.evaluate(
      ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
      { key: BOOKMARK_KEY, data: { 'JA/MN-001': { status: 'activated', savedAt: '2026-02-21T10:00:00Z' } } }
    )

    await page.goto(`${BASE}/bookmarks`)
    await expect(page.getByText('JA/MN-001').first()).toBeVisible()

    // Reload page
    await page.reload()

    // Should still show the bookmark
    await expect(page.getByText('JA/MN-001').first()).toBeVisible()
  })
})
