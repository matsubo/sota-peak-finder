import { test, expect } from '@playwright/test'

test.describe('オフラインQTH アプリケーション', () => {
  test.beforeEach(async ({ page, context }) => {
    // 位置情報の許可を事前に付与
    await context.grantPermissions(['geolocation'])
    // テスト用の位置情報を設定（東京）
    await context.setGeolocation({ latitude: 35.6895, longitude: 139.6917 })
    await page.goto('/')
  })

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/オフラインQTH/)
    await expect(page.locator('h1')).toContainText('オフラインQTH')
  })

  test('位置情報が自動的に取得される', async ({ page }) => {
    // ステータスメッセージが表示されることを確認
    await expect(page.locator('text=位置情報を取得中')).toBeVisible()

    // 位置情報が取得されるまで待機（最大10秒）
    await expect(page.locator('text=位置情報を取得しました')).toBeVisible({ timeout: 10000 })

    // 緯度が表示されることを確認
    await expect(page.locator('text=緯度')).toBeVisible()
    await expect(page.locator('text=経度')).toBeVisible()
  })

  test('グリッドロケーターが表示される', async ({ page }) => {
    // 位置情報取得完了まで待機
    await expect(page.locator('text=位置情報を取得しました')).toBeVisible({ timeout: 10000 })

    // グリッドロケーターが表示されることを確認
    await expect(page.locator('text=グリッドロケーター')).toBeVisible()

    // グリッドロケーターの値が英数字であることを確認（例：PM95vr）
    const gridLocator = await page.locator('text=グリッドロケーター').locator('..').textContent()
    expect(gridLocator).toMatch(/[A-Z]{2}\d{2}[a-z]{2}/)
  })

  test('再取得ボタンが機能する', async ({ page }) => {
    // 最初の取得完了を待機
    await expect(page.locator('text=位置情報を取得しました')).toBeVisible({ timeout: 10000 })

    // 再取得ボタンをクリック
    await page.click('button:has-text("再取得")')

    // 再度ステータスメッセージが表示されることを確認
    await expect(page.locator('text=位置情報を取得中')).toBeVisible()
    await expect(page.locator('text=位置情報を取得しました')).toBeVisible({ timeout: 10000 })
  })

  test('オンライン状態が表示される', async ({ page }) => {
    // オンライン表示を確認
    await expect(page.locator('text=オンライン')).toBeVisible()
  })

  test('必要な情報がすべて表示される', async ({ page }) => {
    // 位置情報取得完了まで待機
    await expect(page.locator('text=位置情報を取得しました')).toBeVisible({ timeout: 10000 })

    // 全ての項目が表示されることを確認
    await expect(page.locator('text=緯度')).toBeVisible()
    await expect(page.locator('text=経度')).toBeVisible()
    await expect(page.locator('text=標高')).toBeVisible()
    await expect(page.locator('text=都道府県')).toBeVisible()
    await expect(page.locator('text=市区町村')).toBeVisible()
    await expect(page.locator('text=グリッドロケーター')).toBeVisible()
    await expect(page.locator('text=JCC')).toBeVisible()
    await expect(page.locator('text=JCG')).toBeVisible()
  })

  test('フッターにリンクが表示される', async ({ page }) => {
    // JE1WFVのリンクを確認
    await expect(page.locator('a:has-text("JE1WFV")')).toBeVisible()
    await expect(page.locator('a:has-text("JE1WFV")')).toHaveAttribute('href', 'https://x.com/je1wfv')

    // GitHubリンクを確認
    await expect(page.locator('a:has-text("GitHub")')).toBeVisible()
    await expect(page.locator('a:has-text("GitHub")')).toHaveAttribute('href', 'https://github.com/matsubo/sota-peak-finder')
  })
})

test.describe('Summit detail page', () => {
  test('shows weather forecast card', async ({ page }) => {
    // Navigate to a known summit (Mount Fuji JA/SO-001)
    await page.goto('/summit/ja-so-001')

    // Wait for summit data to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 30000 })

    // Weather card should be visible (may take a moment to fetch)
    await expect(
      page.locator('text=7-Day Weather Forecast').or(page.locator('text=7日間の天気予報'))
    ).toBeVisible({ timeout: 15000 })

    // Should show Open-Meteo attribution
    await expect(page.locator('text=Open-Meteo')).toBeVisible()
  })
})
