# Activation History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add recent activation logs to summit detail pages with clickable callsigns linking to a dedicated activator history page.

**Architecture:** Live API fetch from SOTA API on page view, cached via Service Worker (12hr TTL). Two new components (RecentActivations, ActivatorPage), two new hooks, two new API functions, i18n for EN/JA, and SW cache rules for both API domains.

**Tech Stack:** React 19, TypeScript, react-router-dom v7, i18next, Workbox (via vite-plugin-pwa), Lucide React icons.

---

### Task 1: Add API fetch functions for activations

**Files:**
- Modify: `src/utils/api.ts` (append to end of file)

**Step 1: Add types and fetch functions**

Add the following to the end of `src/utils/api.ts`:

```typescript
/**
 * SOTA activation record for a summit
 */
export interface SummitActivation {
  id: number
  userId: number
  activationDate: string
  ownCallsign: string
  qsos: number
}

/**
 * SOTA activator log record
 */
export interface ActivatorLogEntry {
  ActivationId: number
  ActivationDate: string
  OwnCallsign: string
  SummitCode: string
  Summit: string
  Points: number
  BonusPoints: number
  Total: number
  QSOs: number
}

/**
 * Fetch recent activations for a summit from SOTA API
 *
 * @param summitRef - Summit reference (e.g., "JA/TK-001")
 * @param limit - Maximum number of activations to return (default 10)
 * @returns Array of activation records, sorted by most recent first
 */
export async function fetchSummitActivations(
  summitRef: string,
  limit: number = 10
): Promise<SummitActivation[]> {
  // Split "JA/TK-001" into "JA" and "TK-001"
  const slashIndex = summitRef.indexOf('/')
  if (slashIndex === -1) return []

  const association = summitRef.substring(0, slashIndex)
  const summitCode = summitRef.substring(slashIndex + 1)

  const url = `https://api2.sota.org.uk/api/activations/${association}/${summitCode}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch activations: ${response.status}`)
  }

  const data: SummitActivation[] = await response.json()
  return data.slice(0, limit)
}

/**
 * Fetch activation history for an activator by user ID
 *
 * @param userId - Numeric user ID from SOTA
 * @param limit - Maximum number of records to return (default 100)
 * @returns Array of activation log entries
 */
export async function fetchActivatorHistory(
  userId: number,
  limit: number = 100
): Promise<ActivatorLogEntry[]> {
  const url = `https://api-db2.sota.org.uk/logs/activator/${userId}/${limit}/1`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch activator history: ${response.status}`)
  }

  const data: ActivatorLogEntry[] = await response.json()
  return data
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/utils/api.ts
git commit -m "feat: add SOTA activation API fetch functions"
```

---

### Task 2: Add useActivations hook

**Files:**
- Create: `src/hooks/useActivations.ts`

**Step 1: Create the hook**

Create `src/hooks/useActivations.ts`:

```typescript
import { useState, useEffect } from 'react'
import { fetchSummitActivations, type SummitActivation } from '../utils/api'

interface UseActivationsResult {
  activations: SummitActivation[]
  loading: boolean
  error: string | null
}

export function useActivations(summitRef: string | undefined): UseActivationsResult {
  const [activations, setActivations] = useState<SummitActivation[]>([])
  const [loading, setLoading] = useState(!!summitRef)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!summitRef) return

    let cancelled = false

    fetchSummitActivations(summitRef, 10)
      .then((data) => {
        if (!cancelled) {
          setActivations(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Activations fetch failed:', err)
          setError(err instanceof Error ? err.message : 'Failed to load activations')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [summitRef])

  return { activations, loading, error }
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useActivations.ts
git commit -m "feat: add useActivations hook for summit activation data"
```

---

### Task 3: Add useActivatorHistory hook

**Files:**
- Create: `src/hooks/useActivatorHistory.ts`

**Step 1: Create the hook**

Create `src/hooks/useActivatorHistory.ts`:

```typescript
import { useState, useEffect } from 'react'
import { fetchActivatorHistory, type ActivatorLogEntry } from '../utils/api'

interface UseActivatorHistoryResult {
  activations: ActivatorLogEntry[]
  callsign: string | null
  loading: boolean
  error: string | null
}

export function useActivatorHistory(userId: string | undefined): UseActivatorHistoryResult {
  const [activations, setActivations] = useState<ActivatorLogEntry[]>([])
  const [callsign, setCallsign] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!userId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const numericId = parseInt(userId, 10)
    if (isNaN(numericId)) {
      setError('Invalid user ID')
      setLoading(false)
      return
    }

    let cancelled = false

    fetchActivatorHistory(numericId)
      .then((data) => {
        if (!cancelled) {
          setActivations(data)
          if (data.length > 0) {
            setCallsign(data[0].OwnCallsign)
          }
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Activator history fetch failed:', err)
          setError(err instanceof Error ? err.message : 'Failed to load activator history')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { activations, callsign, loading, error }
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useActivatorHistory.ts
git commit -m "feat: add useActivatorHistory hook for activator page"
```

---

### Task 4: Add i18n translations

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/ja/translation.json`

**Step 1: Add English translations**

Add the following keys to `src/locales/en/translation.json` before the closing `}`, after the `"weather"` section:

```json
  "activations": {
    "title": "Recent Activations",
    "date": "Date",
    "callsign": "Callsign",
    "qsos": "QSOs",
    "noActivations": "No activations recorded yet",
    "loading": "Loading activations...",
    "error": "Could not load activation data",
    "unavailableOffline": "Activation data unavailable offline",
    "poweredBy": "Data from SOTAdata"
  },
  "activator": {
    "title": "Activator",
    "totalActivations": "Activations",
    "totalQsos": "Total QSOs",
    "totalPoints": "Total Points",
    "summit": "Summit",
    "date": "Date",
    "qsos": "QSOs",
    "points": "Points",
    "loading": "Loading activator history...",
    "error": "Could not load activator history",
    "noHistory": "No activation history found"
  }
```

**Step 2: Add Japanese translations**

Add the following keys to `src/locales/ja/translation.json` before the closing `}`, after the `"weather"` section:

```json
  "activations": {
    "title": "最近のアクティベーション",
    "date": "日付",
    "callsign": "コールサイン",
    "qsos": "QSO数",
    "noActivations": "まだアクティベーション記録がありません",
    "loading": "アクティベーション情報を読み込み中...",
    "error": "アクティベーションデータを取得できませんでした",
    "unavailableOffline": "オフライン時はアクティベーションデータを表示できません",
    "poweredBy": "データ提供: SOTAdata"
  },
  "activator": {
    "title": "アクティベーター",
    "totalActivations": "アクティベーション回数",
    "totalQsos": "合計QSO数",
    "totalPoints": "合計ポイント",
    "summit": "山頂",
    "date": "日付",
    "qsos": "QSO数",
    "points": "ポイント",
    "loading": "アクティベーター履歴を読み込み中...",
    "error": "アクティベーター履歴を取得できませんでした",
    "noHistory": "アクティベーション履歴が見つかりません"
  }
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/locales/en/translation.json src/locales/ja/translation.json
git commit -m "feat: add i18n translations for activation history (EN/JA)"
```

---

### Task 5: Create RecentActivations component

**Files:**
- Create: `src/components/RecentActivations.tsx`

**Step 1: Create the component**

Create `src/components/RecentActivations.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { Radio, Loader } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useActivations } from '../hooks/useActivations'

interface RecentActivationsProps {
  summitRef: string
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function RecentActivations({ summitRef }: RecentActivationsProps) {
  const { t, i18n } = useTranslation()
  const { activations, loading, error } = useActivations(summitRef)

  if (!navigator.onLine && activations.length === 0) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in border-l-4 border-l-teal-500/50">
        <div className="text-sm font-mono-data text-teal-400/60">
          {t('activations.unavailableOffline')}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Loader className="w-5 h-5 text-teal-400 animate-spin" />
          <span className="text-sm font-mono-data text-teal-400/60">
            {t('activations.loading')}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in border-l-4 border-l-orange-500/50">
        <div className="text-sm font-mono-data text-orange-400/80">
          {t('activations.error')}
        </div>
      </div>
    )
  }

  return (
    <div className="card-technical rounded p-6 animate-fade-in">
      <h2 className="text-xl font-display glow-teal mb-1 flex items-center">
        <Radio className="w-5 h-5 mr-2" />
        {t('activations.title')}
      </h2>
      <p className="text-xs font-mono-data text-teal-400/60 mb-4">
        {t('activations.poweredBy')}
      </p>

      {activations.length === 0 ? (
        <div className="text-sm font-mono-data text-gray-500">
          {t('activations.noActivations')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-teal-500/30">
                <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">
                  {t('activations.date')}
                </th>
                <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">
                  {t('activations.callsign')}
                </th>
                <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">
                  {t('activations.qsos')}
                </th>
              </tr>
            </thead>
            <tbody>
              {activations.map((activation) => (
                <tr
                  key={activation.id}
                  className="border-b border-gray-700/50 hover:bg-teal-500/5"
                >
                  <td className="py-3 px-2 font-mono-data text-gray-300">
                    {formatDate(activation.activationDate, i18n.language)}
                  </td>
                  <td className="py-3 px-2">
                    <Link
                      to={`/activator/${activation.userId}`}
                      className="font-mono-data text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {activation.ownCallsign}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-right font-mono-data text-green-400">
                    {activation.qsos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/RecentActivations.tsx
git commit -m "feat: add RecentActivations component for summit page"
```

---

### Task 6: Integrate RecentActivations into SummitPage

**Files:**
- Modify: `src/pages/SummitPage.tsx`

**Step 1: Add import**

Add after the `WeatherForecast` import (line 14):

```typescript
import { RecentActivations } from '../components/RecentActivations'
```

**Step 2: Add component to page**

In the JSX, add `<RecentActivations>` after the `<WeatherForecast>` component (after line 391):

```tsx
            {/* Recent Activations */}
            <RecentActivations summitRef={summit.ref} />
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/pages/SummitPage.tsx
git commit -m "feat: integrate RecentActivations into summit detail page"
```

---

### Task 7: Create ActivatorPage

**Files:**
- Create: `src/pages/ActivatorPage.tsx`

**Step 1: Create the page component**

Create `src/pages/ActivatorPage.tsx`:

```tsx
import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Radio, Loader } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useActivatorHistory } from '../hooks/useActivatorHistory'
import { sotaDatabase } from '../utils/sotaDatabase'

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function ActivatorPage() {
  const { userId } = useParams<{ userId: string }>()
  const { t, i18n } = useTranslation()
  const { activations, callsign, loading, error } = useActivatorHistory(userId)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [sotaCount, setSotaCount] = useState<number | null>(null)
  const [sotaBuildDate, setSotaBuildDate] = useState<string | null>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        await sotaDatabase.init()
        const stats = await sotaDatabase.getStats()
        const metadata = await sotaDatabase.getMetadata()
        setSotaCount(stats.totalSummits)
        if (metadata.buildDate) {
          const date = new Date(metadata.buildDate)
          const formatted = new Intl.DateTimeFormat(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }).format(date)
          setSotaBuildDate(formatted)
        }
      } catch (error) {
        console.error('Failed to load database stats:', error)
      }
    }
    loadStats()
  }, [i18n.language])

  const totalQsos = activations.reduce((sum, a) => sum + a.QSOs, 0)
  const totalPoints = activations.reduce((sum, a) => sum + a.Total, 0)
  const pageTitle = callsign
    ? `${callsign} - SOTA Activator History | SOTA Peak Finder`
    : 'SOTA Activator History | SOTA Peak Finder'

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`SOTA activation history for ${callsign || 'activator'}`} />
      </Helmet>

      <div className="min-h-screen p-3 sm:p-4 md:p-5 relative z-10">
        <div className="mx-auto max-w-6xl">
          <Header isOnline={isOnline} />

          {/* Back navigation */}
          <div className="mb-6 animate-fade-in">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-sm font-mono-data text-teal-400 hover:text-teal-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.backToHome')}
            </button>
          </div>

          {loading && (
            <div className="card-technical rounded p-8 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-3">
                <Loader className="w-5 h-5 text-teal-400 animate-spin" />
                <span className="text-sm font-mono-data text-teal-400/60">
                  {t('activator.loading')}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="card-technical rounded p-8 text-center animate-fade-in">
              <div className="text-sm font-mono-data text-orange-400/80">
                {t('activator.error')}
              </div>
              <Link to="/" className="btn-primary inline-flex items-center mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.backToHome')}
              </Link>
            </div>
          )}

          {!loading && !error && (
            <main className="space-y-6">
              {/* Activator Header */}
              <div className="card-technical rounded-none border-l-4 border-l-amber-500 p-6 corner-accent animate-fade-in">
                <div className="text-xs font-mono-data glow-teal mb-2 tracking-wider">
                  ACTIVATOR // {t('activator.title')}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-display glow-amber mb-2">
                  {callsign || 'Unknown'}
                </h1>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 animate-fade-in">
                <div className="card-technical rounded p-4">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">{t('activator.totalActivations')}</div>
                  <div className="text-2xl font-mono-data text-cyan-400">{activations.length}</div>
                </div>

                <div className="card-technical rounded p-4">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">{t('activator.totalQsos')}</div>
                  <div className="text-2xl font-mono-data glow-green">{totalQsos}</div>
                </div>

                <div className="card-technical rounded p-4">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">{t('activator.totalPoints')}</div>
                  <div className="text-2xl font-mono-data glow-amber">{totalPoints}</div>
                </div>
              </div>

              {/* Activation History Table */}
              <div className="card-technical rounded p-6 animate-fade-in">
                <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                  <Radio className="w-5 h-5 mr-2" />
                  {t('activations.title')}
                </h2>

                {activations.length === 0 ? (
                  <div className="text-sm font-mono-data text-gray-500">
                    {t('activator.noHistory')}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-teal-500/30">
                          <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">
                            {t('activator.date')}
                          </th>
                          <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">
                            {t('activator.summit')}
                          </th>
                          <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">
                            {t('activator.qsos')}
                          </th>
                          <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">
                            {t('activator.points')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activations.map((activation) => (
                          <tr
                            key={activation.ActivationId}
                            className="border-b border-gray-700/50 hover:bg-teal-500/5"
                          >
                            <td className="py-3 px-2 font-mono-data text-gray-300">
                              {formatDate(activation.ActivationDate, i18n.language)}
                            </td>
                            <td className="py-3 px-2">
                              <Link
                                to={`/summit/${activation.SummitCode.toLowerCase().replace(/\//g, '-')}`}
                                className="font-mono-data text-amber-400 hover:text-amber-300 transition-colors"
                              >
                                {activation.SummitCode}
                              </Link>
                              <span className="ml-2 text-gray-500 text-xs">{activation.Summit}</span>
                            </td>
                            <td className="py-3 px-2 text-right font-mono-data text-green-400">
                              {activation.QSOs}
                            </td>
                            <td className="py-3 px-2 text-right font-mono-data text-amber-400">
                              {activation.Total}pt
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </main>
          )}

          <Footer isOnline={isOnline} sotaCount={sotaCount} sotaBuildDate={sotaBuildDate} />
        </div>
      </div>
    </>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/ActivatorPage.tsx
git commit -m "feat: add ActivatorPage with activation history table"
```

---

### Task 8: Add route and analytics for ActivatorPage

**Files:**
- Modify: `src/main.tsx`

**Step 1: Add import**

Add after the `NotFound` import (line 10):

```typescript
import { ActivatorPage } from './pages/ActivatorPage.tsx'
```

**Step 2: Add route**

Add the following route after the `/summit/:ref` route (after line 47):

```tsx
          <Route path="/activator/:userId" element={<ActivatorPage />} />
```

**Step 3: Add analytics tracking**

In the `getPageTitle` function (around line 28), add before the `return 'Home'` line:

```typescript
      if (location.pathname.startsWith('/activator/')) return 'Activator History'
```

**Step 4: Verify TypeScript compiles**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/main.tsx
git commit -m "feat: add /activator/:userId route"
```

---

### Task 9: Add Service Worker cache rules for SOTA APIs

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add cache rules**

Add the following two entries to the `runtimeCaching` array in `vite.config.ts`, after the Open-Meteo entry (after line 132):

```typescript
          {
            // SOTA activations API - cache for 12 hours
            urlPattern: /^https:\/\/api2\.sota\.org\.uk\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sota-activations-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12 // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // SOTA activator logs API - cache for 12 hours
            urlPattern: /^https:\/\/api-db2\.sota\.org\.uk\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sota-activator-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12 // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
```

**Step 2: Verify the app builds**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx vite build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat: add Service Worker cache rules for SOTA activation APIs"
```

---

### Task 10: Manual verification and E2E test

**Files:**
- Modify: `e2e/app.spec.ts`

**Step 1: Start dev server and verify manually**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx vite dev`

Verify the following in the browser:
1. Navigate to `/summit/ja-tk-001` — Recent Activations section appears with 10 entries
2. Click a callsign — navigates to `/activator/{userId}` showing full history
3. Click a summit code on the activator page — navigates back to summit detail

**Step 2: Add E2E test**

Add the following test to `e2e/app.spec.ts` after the existing summit detail test (after line 100):

```typescript
test.describe('Summit activation history', () => {
  test('shows recent activations on summit page', async ({ page }) => {
    await page.goto('/summit/ja-tk-001')

    // Wait for summit data to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 30000 })

    // Recent Activations section should be visible
    await expect(
      page.locator('text=Recent Activations').or(page.locator('text=最近のアクティベーション'))
    ).toBeVisible({ timeout: 15000 })

    // Should show SOTAdata attribution
    await expect(page.locator('text=SOTAdata')).toBeVisible()
  })

  test('navigates to activator page when clicking callsign', async ({ page }) => {
    await page.goto('/summit/ja-tk-001')

    // Wait for activations to load
    await expect(
      page.locator('text=Recent Activations').or(page.locator('text=最近のアクティベーション'))
    ).toBeVisible({ timeout: 15000 })

    // Click the first callsign link in the activations table
    const firstCallsign = page.locator('table').last().locator('tbody tr').first().locator('a')
    await expect(firstCallsign).toBeVisible({ timeout: 10000 })
    await firstCallsign.click()

    // Should navigate to activator page
    await expect(page).toHaveURL(/\/activator\/\d+/)

    // Activator page should show callsign and history
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
  })
})
```

**Step 3: Run E2E tests**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx playwright test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add e2e/app.spec.ts
git commit -m "test: add E2E tests for activation history feature"
```
