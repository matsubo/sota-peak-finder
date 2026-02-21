# Summit Bookmarks Feature Design

**Date:** 2026-02-21
**Issue:** #12 — Feature: Bookmark summits with status tracking

## Overview

Allow users to bookmark summits with one of two statuses ("Want to Go" or "Activated"), persisted in localStorage. Bookmarks are visible across all list/nearby views and accessible from a dedicated Bookmarks page linked from the header.

## Architecture

### Data Layer — `useBookmarks` hook

**File:** `src/hooks/useBookmarks.ts`

Manages all bookmark state. Reads from `sota-bookmarks` localStorage key on mount; writes on every change.

```ts
type BookmarkStatus = 'want_to_go' | 'activated'

interface Bookmark {
  status: BookmarkStatus
  savedAt: string  // ISO 8601
}

// localStorage shape
// { "JA/KN-001": { status: "want_to_go", savedAt: "2026-02-21T00:00:00Z" }, ... }

interface UseBookmarksReturn {
  bookmarks: Record<string, Bookmark>
  getStatus: (ref: string) => BookmarkStatus | null
  cycleBookmark: (ref: string) => void   // none → want_to_go → activated → none
  removeBookmark: (ref: string) => void
  bookmarkCount: number
}
```

**Cycle order:** no bookmark → `want_to_go` → `activated` → no bookmark (remove)

**Error handling:**
- localStorage read: wrapped in try/catch; falls back to `{}` silently if corrupted or unavailable
- localStorage write: wrapped in try/catch; failure is silent; in-memory state still updates for the session

### New Route

`/bookmarks` → `BookmarksPage`

## Components

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useBookmarks.ts` | Hook for all bookmark state and localStorage I/O |
| `src/pages/BookmarksPage.tsx` | `/bookmarks` route — summits grouped by status with remove action |
| `src/components/BookmarkButton.tsx` | Reusable cycle-toggle icon button |

### Modified Files

| File | Change |
|------|--------|
| `src/components/Header.tsx` | Add bookmark icon with count badge (hidden when 0) |
| `src/pages/SummitPage.tsx` | Add `BookmarkButton` in title card next to share button |
| `src/components/SummitTable.tsx` | Add `BookmarkButton` in a new rightmost column |
| `src/pages/NearbyPage.tsx` | Add `BookmarkButton` on each summit card |
| `main.tsx` (router) | Register `/bookmarks` route |
| `src/locales/*.json` | Add bookmark-related i18n keys |

### BookmarkButton Visual States

Fits the existing dark technical aesthetic:

| State | Icon | Color |
|-------|------|-------|
| No bookmark | Outline bookmark | `text-teal-400/40` |
| Want to Go | Filled star | `text-amber-400` |
| Activated | Filled trophy/check | `text-green-400` |

### BookmarksPage Layout

- Header: "Bookmarks" title with total count
- Two sections: "Want to Go" and "Activated", each showing a list of summit refs/names
- Each entry has: summit ref (link to SummitPage), name, savedAt date, remove button
- Empty state: friendly message when no bookmarks exist

## i18n

New keys to add to all locale files (`src/locales/`):

```json
{
  "bookmarks.title": "Bookmarks",
  "bookmarks.wantToGo": "Want to Go",
  "bookmarks.activated": "Activated",
  "bookmarks.empty": "No bookmarks yet",
  "bookmarks.emptyDesc": "Tap the bookmark icon on any summit to save it here.",
  "bookmarks.savedAt": "Saved",
  "bookmarks.remove": "Remove"
}
```

## Acceptance Criteria

- [ ] User can bookmark a summit as "Want to Go" or "Activated" via cycle toggle from the summit detail view
- [ ] Bookmark status persists after page reload (localStorage)
- [ ] Bookmarked summits show a visible status icon in SummitsListPage table and NearbyPage cards
- [ ] `/bookmarks` page lists all bookmarked summits grouped by status
- [ ] Header shows bookmark icon with count badge (hidden when count is 0)
- [ ] User can remove a bookmark from the Bookmarks page
- [ ] User can cycle through / change status from any bookmark button
- [ ] No backend calls required

## Testing Plan

### Unit Tests
- `useBookmarks` hook: cycle logic, localStorage read/write, corrupted data fallback, removeBookmark
- `BookmarkButton`: renders correct icon per state, calls `cycleBookmark` on click

### E2E (Playwright)
1. Navigate to a summit detail page
2. Click bookmark button — verify icon changes to "Want to Go" (amber star)
3. Click again — verify icon changes to "Activated" (green check)
4. Navigate to `/summits` — verify status icon visible on that summit's row
5. Navigate to `/bookmarks` — verify summit appears under "Activated" section
6. Click remove — verify summit disappears from Bookmarks page
7. Navigate back to summit detail — verify icon is back to no-bookmark state
