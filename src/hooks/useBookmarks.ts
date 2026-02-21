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
          [ref]: { status: nextStatus, savedAt: prev[ref]?.savedAt ?? new Date().toISOString() },
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
