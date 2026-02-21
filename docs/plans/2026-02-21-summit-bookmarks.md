# Summit Bookmarks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add localStorage-based summit bookmarking with "Want to Go" / "Activated" statuses, visible across all summit list/nearby views and accessible from a dedicated `/bookmarks` page linked from the header.

**Architecture:** A `useBookmarks` custom hook owns all bookmark state, reading/writing the `sota-bookmarks` localStorage key. A reusable `BookmarkButton` component handles the cycle-toggle UI. A new `BookmarksPage` groups bookmarked summits by status.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, lucide-react icons, react-i18next, react-router-dom v7

> **Note on testing:** This project has no unit test framework (only Playwright E2E). Each task below commits working code incrementally. The E2E tests in Task 10 are the automated verification layer.

---

### Task 1: Add i18n keys (English + Japanese)

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/ja/translation.json`

**Step 1: Add `bookmarks` key to English locale**

Open `src/locales/en/translation.json`. Add this new top-level key at the end (before the closing `}`):

```json
  "bookmarks": {
    "title": "Bookmarks",
    "wantToGo": "Want to Go",
    "activated": "Activated",
    "empty": "No bookmarks yet",
    "emptyDesc": "Tap the bookmark icon on any summit to save it here.",
    "savedAt": "Saved",
    "remove": "Remove",
    "count": "{{count}} bookmarked",
    "headerTitle": "Bookmarks"
  }
```

**Step 2: Add `bookmarks` key to Japanese locale**

Open `src/locales/ja/translation.json`. Add this new top-level key at the end:

```json
  "bookmarks": {
    "title": "ブックマーク",
    "wantToGo": "行きたい",
    "activated": "活性済み",
    "empty": "ブックマークはありません",
    "emptyDesc": "サミットのブックマークアイコンをタップしてここに保存できます。",
    "savedAt": "保存日",
    "remove": "削除",
    "count": "{{count}} 件",
    "headerTitle": "ブックマーク"
  }
```

**Step 3: Verify JSON is valid**

```bash
node -e "require('./src/locales/en/translation.json'); console.log('EN OK')"
node -e "require('./src/locales/ja/translation.json'); console.log('JA OK')"
```

Expected: `EN OK` and `JA OK`

**Step 4: Commit**

```bash
git add src/locales/en/translation.json src/locales/ja/translation.json
git commit -m "feat: add bookmark i18n keys (en + ja)"
```

---

### Task 2: Create `useBookmarks` hook

**Files:**
- Create: `src/hooks/useBookmarks.ts`

**Step 1: Create the hook**

Create `src/hooks/useBookmarks.ts` with this content:

```typescript
import { useState, useCallback } from 'react'

export type BookmarkStatus = 'want_to_go' | 'activated'

export interface Bookmark {
  status: BookmarkStatus
  savedAt: string
}

type BookmarkStore = Record<string, Bookmark>

const STORAGE_KEY = 'sota-bookmarks'

function readFromStorage(): BookmarkStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as BookmarkStore
  } catch {
    return {}
  }
}

function writeToStorage(store: BookmarkStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Silently fail (e.g. storage quota exceeded in private browsing)
  }
}

const CYCLE_ORDER: (BookmarkStatus | null)[] = [null, 'want_to_go', 'activated']

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkStore>(() => readFromStorage())

  const getStatus = useCallback(
    (ref: string): BookmarkStatus | null => bookmarks[ref]?.status ?? null,
    [bookmarks]
  )

  const cycleBookmark = useCallback((ref: string) => {
    setBookmarks(prev => {
      const current = prev[ref]?.status ?? null
      const currentIndex = CYCLE_ORDER.indexOf(current)
      const nextStatus = CYCLE_ORDER[(currentIndex + 1) % CYCLE_ORDER.length]

      let next: BookmarkStore
      if (nextStatus === null) {
        const { [ref]: _, ...rest } = prev
        next = rest
      } else {
        next = {
          ...prev,
          [ref]: { status: nextStatus, savedAt: new Date().toISOString() },
        }
      }

      writeToStorage(next)
      return next
    })
  }, [])

  const removeBookmark = useCallback((ref: string) => {
    setBookmarks(prev => {
      const { [ref]: _, ...next } = prev
      writeToStorage(next)
      return next
    })
  }, [])

  const bookmarkCount = Object.keys(bookmarks).length

  return { bookmarks, getStatus, cycleBookmark, removeBookmark, bookmarkCount }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useBookmarks.ts
git commit -m "feat: add useBookmarks hook with localStorage persistence"
```

---

### Task 3: Create `BookmarkButton` component

**Files:**
- Create: `src/components/BookmarkButton.tsx`

**Step 1: Create the component**

Create `src/components/BookmarkButton.tsx`:

```typescript
import { Bookmark, Star, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BookmarkStatus } from '../hooks/useBookmarks'

interface BookmarkButtonProps {
  status: BookmarkStatus | null
  onCycle: () => void
  size?: 'sm' | 'md'
}

export function BookmarkButton({ status, onCycle, size = 'md' }: BookmarkButtonProps) {
  const { t } = useTranslation()

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const buttonSize = size === 'sm' ? 'p-1' : 'p-1.5'

  const getIconAndLabel = () => {
    if (status === 'want_to_go') {
      return {
        icon: <Star className={`${iconSize} fill-current`} />,
        color: 'text-amber-400 border-amber-500/50 hover:border-amber-500',
        label: t('bookmarks.wantToGo'),
      }
    }
    if (status === 'activated') {
      return {
        icon: <Trophy className={`${iconSize} fill-current`} />,
        color: 'text-green-400 border-green-500/50 hover:border-green-500',
        label: t('bookmarks.activated'),
      }
    }
    return {
      icon: <Bookmark className={`${iconSize}`} />,
      color: 'text-teal-400/40 border-teal-500/20 hover:border-teal-500/50 hover:text-teal-400/70',
      label: t('bookmarks.title'),
    }
  }

  const { icon, color, label } = getIconAndLabel()

  return (
    <button
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        onCycle()
      }}
      title={label}
      aria-label={label}
      className={`${buttonSize} rounded border transition-all ${color}`}
    >
      {icon}
    </button>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/components/BookmarkButton.tsx
git commit -m "feat: add BookmarkButton component (cycle-toggle)"
```

---

### Task 4: Create `BookmarksPage`

**Files:**
- Create: `src/pages/BookmarksPage.tsx`

**Step 1: Create the page**

Create `src/pages/BookmarksPage.tsx`:

```typescript
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bookmark, Star, Trophy, Trash2, ArrowLeft } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useBookmarks } from '../hooks/useBookmarks'

export function BookmarksPage() {
  const { t } = useTranslation()
  const { bookmarks, removeBookmark } = useBookmarks()

  const wantToGo = Object.entries(bookmarks).filter(([, b]) => b.status === 'want_to_go')
  const activated = Object.entries(bookmarks).filter(([, b]) => b.status === 'activated')
  const isEmpty = wantToGo.length === 0 && activated.length === 0

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return ''
    }
  }

  const summitUrl = (ref: string) =>
    `/summit/${ref.toLowerCase().replace(/\//g, '-')}`

  const SummitEntry = ({ ref, savedAt }: { ref: string; savedAt: string }) => (
    <div className="flex items-center justify-between gap-3 data-panel rounded p-3 hover:bg-teal-500/5 transition-colors">
      <div className="flex-1 min-w-0">
        <Link
          to={summitUrl(ref)}
          className="font-mono-data text-amber-400 hover:text-amber-300 transition-colors text-sm"
        >
          {ref}
        </Link>
        <div className="text-[10px] text-teal-400/50 font-mono-data mt-0.5">
          {t('bookmarks.savedAt')}: {formatDate(savedAt)}
        </div>
      </div>
      <button
        onClick={() => removeBookmark(ref)}
        title={t('bookmarks.remove')}
        aria-label={t('bookmarks.remove')}
        className="p-1.5 rounded border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/50 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>{t('bookmarks.title')} | SOTA Peak Finder</title>
      </Helmet>

      <div className="min-h-screen p-3 sm:p-4 md:p-5 relative z-10">
        <div className="mx-auto max-w-6xl">
          <Header />

          <div className="mb-6 animate-fade-in">
            <div className="card-technical rounded-none border-l-4 border-l-amber-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
                    <Bookmark className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl text-amber-400 tracking-wider">
                      {t('bookmarks.title')}
                    </h1>
                    <p className="text-xs text-teal-300/70 font-mono-data mt-1">
                      {t('bookmarks.count', { count: wantToGo.length + activated.length })}
                    </p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-data text-teal-400 border border-teal-500/30 rounded hover:bg-teal-500/10 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t('common.backToHome')}
                </Link>
              </div>
            </div>
          </div>

          <main className="space-y-4 animate-fade-in">
            {isEmpty ? (
              <div className="card-technical rounded-none p-10 text-center">
                <Bookmark className="w-10 h-10 text-teal-400/30 mx-auto mb-3" />
                <p className="text-gray-400 font-mono-data">{t('bookmarks.empty')}</p>
                <p className="text-xs text-gray-500 font-mono-data mt-2">{t('bookmarks.emptyDesc')}</p>
              </div>
            ) : (
              <>
                {wantToGo.length > 0 && (
                  <div className="card-technical rounded-none border-l-4 border-l-amber-500 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-amber-400 fill-current" />
                      <h2 className="font-display text-amber-400 tracking-wider">
                        {t('bookmarks.wantToGo')}
                        <span className="ml-2 text-sm font-mono-data text-amber-400/60">
                          ({wantToGo.length})
                        </span>
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {wantToGo.map(([ref, b]) => (
                        <SummitEntry key={ref} ref={ref} savedAt={b.savedAt} />
                      ))}
                    </div>
                  </div>
                )}

                {activated.length > 0 && (
                  <div className="card-technical rounded-none border-l-4 border-l-green-500 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-4 h-4 text-green-400 fill-current" />
                      <h2 className="font-display text-green-400 tracking-wider">
                        {t('bookmarks.activated')}
                        <span className="ml-2 text-sm font-mono-data text-green-400/60">
                          ({activated.length})
                        </span>
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {activated.map(([ref, b]) => (
                        <SummitEntry key={ref} ref={ref} savedAt={b.savedAt} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (Footer may need optional props — check existing Footer signature)

**Step 3: Commit**

```bash
git add src/pages/BookmarksPage.tsx
git commit -m "feat: add BookmarksPage grouped by bookmark status"
```

---

### Task 5: Register `/bookmarks` route in `main.tsx`

**Files:**
- Modify: `src/main.tsx`

**Step 1: Add import and route**

In `src/main.tsx`, add the import after the existing page imports:

```typescript
import { BookmarksPage } from './pages/BookmarksPage.tsx'
```

Then add the route inside `<Routes>`, before the `<Route path="*" ...>` catch-all:

```tsx
<Route path="/bookmarks" element={<BookmarksPage />} />
```

Also update the `getPageTitle` function in `PageViewTracker`:

```typescript
if (location.pathname === '/bookmarks') return 'Bookmarks'
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Verify dev server starts**

```bash
npm run dev
```

Navigate to `http://localhost:5173/sota-peak-finder/bookmarks` — should see the empty Bookmarks page.

**Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "feat: register /bookmarks route"
```

---

### Task 6: Add bookmark icon with count badge to `Header`

**Files:**
- Modify: `src/components/Header.tsx`

**Step 1: Add import for useBookmarks and Bookmark icon**

At the top of `src/components/Header.tsx`, add:

```typescript
import { HelpCircle, Database, Map, Bookmark } from 'lucide-react'
import { useBookmarks } from '../hooks/useBookmarks'
import { useTranslation } from 'react-i18next'
```

(Note: `useTranslation` may already be imported — check first)

**Step 2: Use the hook inside the component**

Inside the `Header` function body, add:

```typescript
const { bookmarkCount } = useBookmarks()
const { t } = useTranslation()
```

(Add next to existing hook calls)

**Step 3: Add bookmark nav icon**

In the "Right: Controls" div, add a new `<Link>` for bookmarks before the help icon:

```tsx
<Link
  to="/bookmarks"
  className={`relative p-1.5 rounded border transition-all ${
    location.pathname === '/bookmarks'
      ? 'border-amber-500/60 bg-amber-500/20'
      : 'border-teal-500/40 bg-black/40 hover:bg-amber-500/20'
  }`}
  title={t('bookmarks.headerTitle')}
>
  <Bookmark className={`w-3.5 h-3.5 ${location.pathname === '/bookmarks' ? 'text-amber-400' : 'text-teal-400'}`} />
  {bookmarkCount > 0 && (
    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-amber-500 text-black text-[8px] font-bold font-mono-data">
      {bookmarkCount > 9 ? '9+' : bookmarkCount}
    </span>
  )}
</Link>
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 5: Verify visually**

```bash
npm run dev
```

Header should now show a bookmark icon. Navigate to `/bookmarks` — icon should highlight amber.

**Step 6: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add bookmark icon with count badge to header nav"
```

---

### Task 7: Add `BookmarkButton` to `SummitPage`

**Files:**
- Modify: `src/pages/SummitPage.tsx`

**Step 1: Add imports**

At the top of `src/pages/SummitPage.tsx`, add:

```typescript
import { BookmarkButton } from '../components/BookmarkButton'
import { useBookmarks } from '../hooks/useBookmarks'
```

**Step 2: Use the hook**

Inside the `SummitPage` function body, add:

```typescript
const { getStatus, cycleBookmark } = useBookmarks()
```

**Step 3: Add button to title card**

In the summit title card section, find the `<a>` tag for the share-on-X button. Place the `BookmarkButton` directly above it:

```tsx
<div className="mt-4 flex items-center gap-2">
  <BookmarkButton
    status={getStatus(summit.ref)}
    onCycle={() => cycleBookmark(summit.ref)}
  />
  <span className="text-xs font-mono-data text-teal-400/50">
    {getStatus(summit.ref) === 'want_to_go' && t('bookmarks.wantToGo')}
    {getStatus(summit.ref) === 'activated' && t('bookmarks.activated')}
    {getStatus(summit.ref) === null && t('bookmarks.title')}
  </span>
</div>
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 5: Verify visually**

```bash
npm run dev
```

Navigate to any summit detail page (e.g. `/summit/ja-kn-001`). The bookmark button should appear in the title card. Clicking it should cycle through states; the header count badge should update.

**Step 6: Commit**

```bash
git add src/pages/SummitPage.tsx
git commit -m "feat: add BookmarkButton to SummitPage title card"
```

---

### Task 8: Add `BookmarkButton` to `SummitTable`

**Files:**
- Modify: `src/components/SummitTable.tsx`

**Step 1: Add imports**

At the top of `src/components/SummitTable.tsx`, add:

```typescript
import { BookmarkButton } from './BookmarkButton'
import { useBookmarks } from '../hooks/useBookmarks'
```

**Step 2: Use the hook**

Inside the `SummitTable` function body, add:

```typescript
const { getStatus, cycleBookmark } = useBookmarks()
```

**Step 3: Add column header to desktop table**

In the desktop `<thead>` section, after the last `<th>` (activations), add:

```tsx
<th className="px-3 py-2 text-center text-xs font-semibold text-vfd-green font-mono-data w-10"></th>
```

**Step 4: Add cell to each desktop table row**

In the desktop `<tbody>` rows, after the last `<td>` (activations), add:

```tsx
<td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
  <BookmarkButton
    status={getStatus(summit.ref)}
    onCycle={() => cycleBookmark(summit.ref)}
    size="sm"
  />
</td>
```

**Step 5: Add to mobile card view**

In the mobile card section (the `<div>` that renders when below md breakpoint), find where points and altitude are shown. Add a `BookmarkButton` in the top-right area of each card:

```tsx
<div className="absolute top-2 right-2">
  <BookmarkButton
    status={getStatus(summit.ref)}
    onCycle={() => cycleBookmark(summit.ref)}
    size="sm"
  />
</div>
```

(The mobile card's outer div will need `relative` class — add it if not present)

**Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 7: Verify visually**

```bash
npm run dev
```

Navigate to `/summits`. Each row should have a small bookmark button in the last column.

**Step 8: Commit**

```bash
git add src/components/SummitTable.tsx
git commit -m "feat: add BookmarkButton to SummitTable rows (desktop + mobile)"
```

---

### Task 9: Add `BookmarkButton` to `NearbyPage`

**Files:**
- Modify: `src/pages/NearbyPage.tsx`

**Step 1: Add imports**

At the top of `src/pages/NearbyPage.tsx`, add:

```typescript
import { BookmarkButton } from '../components/BookmarkButton'
import { useBookmarks } from '../hooks/useBookmarks'
```

**Step 2: Use the hook**

Inside the `NearbyPage` function body, add:

```typescript
const { getStatus, cycleBookmark } = useBookmarks()
```

**Step 3: Add button to each summit list item**

Find the `<Link>` that renders each summit in the nearby list (around line 167). The summit list item is rendered inside a `.map()`. Wrap the `<Link>` and button in a flex container:

```tsx
<div key={summit.ref} className="flex items-stretch">
  <Link
    to={`/summit/${summit.ref.toLowerCase().replace(/\//g, '-')}`}
    className="flex-1 ..."  {/* keep existing classes */}
  >
    {/* existing summit content */}
  </Link>
  <div className="flex items-center px-2 border-l border-teal-500/20">
    <BookmarkButton
      status={getStatus(summit.ref)}
      onCycle={() => cycleBookmark(summit.ref)}
      size="sm"
    />
  </div>
</div>
```

Remove the `key={summit.ref}` from the existing `<Link>` and place it on the outer `<div>`.

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 5: Verify visually**

```bash
npm run dev
```

Navigate to `/nearby` and grant location. Each summit card should have a bookmark button on the right edge.

**Step 6: Commit**

```bash
git add src/pages/NearbyPage.tsx
git commit -m "feat: add BookmarkButton to NearbyPage summit cards"
```

---

### Task 10: Write and run E2E tests

**Files:**
- Create: `e2e/bookmarks.spec.ts`

**Step 1: Create the E2E test file**

Create `e2e/bookmarks.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Bookmark feature', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('sota-bookmarks'))
  })

  test('bookmark button cycles through states on summit detail page', async ({ page }) => {
    // Navigate to a known summit (adjust ref as needed for test data)
    await page.goto('/summit/ja-mn-001')
    await page.waitForSelector('[aria-label]')

    // Find the bookmark button by aria-label containing bookmark text
    const bookmarkBtn = page.getByRole('button', { name: /bookmark|want to go|activated/i }).first()

    // Initial state: no bookmark (outline icon)
    await expect(bookmarkBtn).toBeVisible()

    // First click: Want to Go
    await bookmarkBtn.click()
    await expect(page.getByRole('button', { name: /want to go/i }).first()).toBeVisible()

    // Second click: Activated
    await bookmarkBtn.click()
    await expect(page.getByRole('button', { name: /activated/i }).first()).toBeVisible()

    // Third click: back to no bookmark
    await bookmarkBtn.click()
    await expect(page.getByRole('button', { name: /bookmark/i }).first()).toBeVisible()
  })

  test('bookmark persists after page reload', async ({ page }) => {
    await page.goto('/summit/ja-mn-001')
    await page.waitForSelector('[aria-label]')

    const bookmarkBtn = page.getByRole('button', { name: /bookmark|want to go|activated/i }).first()
    await bookmarkBtn.click()  // → Want to Go

    // Reload page
    await page.reload()
    await page.waitForSelector('[aria-label]')

    // Should still show Want to Go
    await expect(page.getByRole('button', { name: /want to go/i }).first()).toBeVisible()
  })

  test('bookmarks page shows empty state initially', async ({ page }) => {
    await page.goto('/bookmarks')
    await expect(page.getByText(/no bookmarks yet/i)).toBeVisible()
  })

  test('bookmarked summit appears on bookmarks page', async ({ page }) => {
    // Bookmark a summit
    await page.goto('/summit/ja-mn-001')
    await page.waitForSelector('[aria-label]')
    const bookmarkBtn = page.getByRole('button', { name: /bookmark|want to go|activated/i }).first()
    await bookmarkBtn.click()  // → Want to Go

    // Go to bookmarks page
    await page.goto('/bookmarks')
    await expect(page.getByText(/want to go/i)).toBeVisible()
    await expect(page.getByText('JA/MN-001').first()).toBeVisible()
  })

  test('remove bookmark from bookmarks page', async ({ page }) => {
    // Set up a bookmark via localStorage directly (faster)
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('sota-bookmarks', JSON.stringify({
        'JA/MN-001': { status: 'want_to_go', savedAt: new Date().toISOString() }
      }))
    })

    await page.goto('/bookmarks')
    await expect(page.getByText('JA/MN-001').first()).toBeVisible()

    // Click remove button
    await page.getByRole('button', { name: /remove/i }).first().click()

    // Should show empty state
    await expect(page.getByText(/no bookmarks yet/i)).toBeVisible()
  })

  test('header shows bookmark count badge', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('sota-bookmarks', JSON.stringify({
        'JA/MN-001': { status: 'want_to_go', savedAt: new Date().toISOString() },
        'JA/MN-002': { status: 'activated', savedAt: new Date().toISOString() }
      }))
    })

    await page.reload()
    // Badge should show "2"
    await expect(page.locator('text=2').first()).toBeVisible()
  })

  test('bookmark visible in summit list view', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('sota-bookmarks', JSON.stringify({
        'JA/MN-001': { status: 'activated', savedAt: new Date().toISOString() }
      }))
    })

    await page.goto('/summits')
    // The bookmark button for the bookmarked summit should have activated style
    // Look for a trophy/activated button
    await expect(page.getByRole('button', { name: /activated/i }).first()).toBeVisible()
  })
})
```

**Step 2: Run the E2E tests**

First make sure the dev server is running (in a separate terminal):
```bash
npm run dev
```

Then run the E2E tests:
```bash
npm run test:e2e -- e2e/bookmarks.spec.ts
```

Expected: All tests pass. If a test fails due to missing summit ref in test data, update the `ja-mn-001` ref to a known valid summit ref from the database.

**Step 3: Commit**

```bash
git add e2e/bookmarks.spec.ts
git commit -m "test: add E2E tests for summit bookmark feature"
```

---

### Task 11: Final build verification

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 3: Commit version bump (optional)**

If all tests pass and build succeeds, update `VERSION.md` to reflect the new feature.

**Step 4: Final commit**

```bash
git add VERSION.md
git commit -m "chore: bump version for bookmark feature"
```
