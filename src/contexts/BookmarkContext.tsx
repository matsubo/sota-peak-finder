import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { trackBookmarkCycle, trackBookmarkRemove } from '../utils/analytics'

export type BookmarkStatus = 'want_to_go' | 'activated'

export interface Bookmark {
  status: BookmarkStatus
  savedAt: string
}

type BookmarkStore = Record<string, Bookmark>

const STORAGE_KEY = 'sota-bookmarks'

const CYCLE_ORDER: (BookmarkStatus | null)[] = [null, 'want_to_go', 'activated']

function isValidBookmarkStore(data: unknown): data is BookmarkStore {
  if (typeof data !== 'object' || data === null) return false
  return Object.entries(data).every(([, v]) => {
    if (typeof v !== 'object' || v === null) return false
    const bookmark = v as Record<string, unknown>
    return (
      (bookmark.status === 'want_to_go' || bookmark.status === 'activated') &&
      typeof bookmark.savedAt === 'string'
    )
  })
}

function readFromStorage(): BookmarkStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return isValidBookmarkStore(parsed) ? parsed : {}
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

interface BookmarkContextValue {
  bookmarks: BookmarkStore
  getStatus: (ref: string) => BookmarkStatus | null
  cycleBookmark: (ref: string) => void
  removeBookmark: (ref: string) => void
  bookmarkCount: number
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null)

export function BookmarkProvider({ children }: { children: ReactNode }) {
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
          [ref]: {
            status: nextStatus,
            savedAt: prev[ref]?.savedAt ?? new Date().toISOString(),
          },
        }
      }

      trackBookmarkCycle(ref, current, nextStatus)
      writeToStorage(next)
      return next
    })
  }, [])

  const removeBookmark = useCallback((ref: string) => {
    setBookmarks(prev => {
      trackBookmarkRemove(ref, prev[ref]?.status ?? null)
      const { [ref]: _, ...next } = prev
      writeToStorage(next)
      return next
    })
  }, [])

  const bookmarkCount = Object.keys(bookmarks).length

  return (
    <BookmarkContext.Provider value={{ bookmarks, getStatus, cycleBookmark, removeBookmark, bookmarkCount }}>
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarks(): BookmarkContextValue {
  const ctx = useContext(BookmarkContext)
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider')
  return ctx
}
