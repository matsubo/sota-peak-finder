# Weather Forecast Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a 7-day altitude-adjusted weather forecast card to the summit detail page using Open-Meteo's free API.

**Architecture:** Client-side only. A React hook fetches weather data from Open-Meteo when a summit page loads. The data is rendered in a `WeatherForecast` component placed between the map and activation info sections. Service Worker caches API responses for 1 hour.

**Tech Stack:** React 19, TypeScript, Open-Meteo API (free, no key), Lucide React icons, i18next, Tailwind CSS, vite-plugin-pwa/Workbox

---

### Task 1: Weather utility module — types and API call

**Files:**
- Create: `src/utils/weather.ts`

**Step 1: Create the weather utility module with types, WMO code mapping, and API function**

```typescript
// src/utils/weather.ts

export interface WeatherDay {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  precipitationSum: number
  windSpeedMax: number
  windGustsMax: number
}

export interface WeatherForecastData {
  days: WeatherDay[]
  elevation: number
  fetchedAt: string
}

/**
 * Map WMO weather codes to descriptive keys for icons and i18n.
 * Full spec: https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
 */
export type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'showers'
  | 'thunderstorm'

export function wmoCodeToCondition(code: number): WeatherCondition {
  if (code === 0) return 'clear'
  if (code <= 2) return 'partlyCloudy'
  if (code === 3) return 'cloudy'
  if (code >= 45 && code <= 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'showers'
  if (code >= 95 && code <= 99) return 'thunderstorm'
  return 'cloudy' // fallback
}

/**
 * Fetch 7-day forecast from Open-Meteo for a given summit.
 * Uses elevation parameter for altitude-adjusted temperatures.
 */
export async function fetchWeatherForecast(
  lat: number,
  lon: number,
  elevation: number
): Promise<WeatherForecastData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    elevation: elevation.toString(),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'weather_code'
    ].join(','),
    timezone: 'auto',
    forecast_days: '7'
  })

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  )

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`)
  }

  const data = await response.json()

  const days: WeatherDay[] = data.daily.time.map(
    (date: string, i: number) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      precipitationSum: data.daily.precipitation_sum[i],
      windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i]),
      windGustsMax: Math.round(data.daily.wind_gusts_10m_max[i])
    })
  )

  return {
    days,
    elevation: data.elevation,
    fetchedAt: new Date().toISOString()
  }
}
```

**Step 2: Verify the file compiles**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && npx tsc --noEmit src/utils/weather.ts 2>&1 || bun run lint`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/utils/weather.ts
git commit -m "feat: add weather utility module with Open-Meteo API types and fetch function"
```

---

### Task 2: Custom hook — useWeatherForecast

**Files:**
- Create: `src/hooks/useWeatherForecast.ts`

**Step 1: Create the hook**

```typescript
// src/hooks/useWeatherForecast.ts

import { useState, useEffect } from 'react'
import {
  fetchWeatherForecast,
  type WeatherForecastData
} from '../utils/weather'

interface UseWeatherForecastResult {
  weather: WeatherForecastData | null
  loading: boolean
  error: string | null
}

export function useWeatherForecast(
  lat: number | undefined,
  lon: number | undefined,
  elevation: number | undefined
): UseWeatherForecastResult {
  const [weather, setWeather] = useState<WeatherForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lat === undefined || lon === undefined || elevation === undefined) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchWeatherForecast(lat, lon, elevation)
      .then((data) => {
        if (!cancelled) {
          setWeather(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Weather fetch failed:', err)
          setError(err instanceof Error ? err.message : 'Failed to load weather')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [lat, lon, elevation])

  return { weather, loading, error }
}
```

**Step 2: Verify lint passes**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && bun run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useWeatherForecast.ts
git commit -m "feat: add useWeatherForecast hook for Open-Meteo API integration"
```

---

### Task 3: i18n strings for weather

**Files:**
- Modify: `src/locales/en/translation.json` — add `weather` key
- Modify: `src/locales/ja/translation.json` — add `weather` key

**Step 1: Add English weather translations**

Add to `src/locales/en/translation.json` as a new top-level `"weather"` key (before closing `}`):

```json
"weather": {
  "title": "7-Day Weather Forecast",
  "altitudeAdjusted": "Altitude-adjusted to {{elevation}}m",
  "tempHigh": "High",
  "tempLow": "Low",
  "wind": "Wind",
  "gusts": "Gusts",
  "precip": "Precip",
  "clear": "Clear",
  "partlyCloudy": "Partly Cloudy",
  "cloudy": "Cloudy",
  "fog": "Fog",
  "drizzle": "Drizzle",
  "rain": "Rain",
  "snow": "Snow",
  "showers": "Showers",
  "thunderstorm": "Thunderstorm",
  "windWarning": "Strong winds (gusts over {{speed}} km/h) expected",
  "unavailableOffline": "Weather forecast unavailable offline",
  "loadError": "Could not load weather data",
  "loading": "Loading forecast...",
  "poweredBy": "Powered by Open-Meteo"
}
```

**Step 2: Add Japanese weather translations**

Add to `src/locales/ja/translation.json` as a new top-level `"weather"` key (before closing `}`):

```json
"weather": {
  "title": "7日間の天気予報",
  "altitudeAdjusted": "標高{{elevation}}mに調整済み",
  "tempHigh": "最高",
  "tempLow": "最低",
  "wind": "風速",
  "gusts": "突風",
  "precip": "降水量",
  "clear": "晴れ",
  "partlyCloudy": "曇り時々晴れ",
  "cloudy": "曇り",
  "fog": "霧",
  "drizzle": "霧雨",
  "rain": "雨",
  "snow": "雪",
  "showers": "にわか雨",
  "thunderstorm": "雷雨",
  "windWarning": "強風注意（突風{{speed}} km/h以上の予報）",
  "unavailableOffline": "オフライン時は天気予報を表示できません",
  "loadError": "天気データを取得できませんでした",
  "loading": "天気予報を読み込み中...",
  "poweredBy": "Powered by Open-Meteo"
}
```

**Step 3: Verify JSON is valid**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && node -e "JSON.parse(require('fs').readFileSync('src/locales/en/translation.json','utf8')); JSON.parse(require('fs').readFileSync('src/locales/ja/translation.json','utf8')); console.log('JSON valid')"`
Expected: `JSON valid`

**Step 4: Commit**

```bash
git add src/locales/en/translation.json src/locales/ja/translation.json
git commit -m "feat: add weather forecast i18n strings (English and Japanese)"
```

---

### Task 4: WeatherForecast component

**Files:**
- Create: `src/components/WeatherForecast.tsx`

**Step 1: Create the component**

```tsx
// src/components/WeatherForecast.tsx

import { useTranslation } from 'react-i18next'
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  Wind,
  Droplets,
  AlertTriangle
} from 'lucide-react'
import { useWeatherForecast } from '../hooks/useWeatherForecast'
import { wmoCodeToCondition, type WeatherCondition } from '../utils/weather'

interface WeatherForecastProps {
  lat: number
  lon: number
  elevation: number
}

function WeatherIcon({
  condition,
  className
}: {
  condition: WeatherCondition
  className?: string
}) {
  const iconClass = className || 'w-8 h-8'
  switch (condition) {
    case 'clear':
      return <Sun className={`${iconClass} text-amber-400`} />
    case 'partlyCloudy':
      return <CloudSun className={`${iconClass} text-amber-300`} />
    case 'cloudy':
      return <Cloud className={`${iconClass} text-gray-400`} />
    case 'fog':
      return <CloudFog className={`${iconClass} text-gray-500`} />
    case 'drizzle':
      return <CloudDrizzle className={`${iconClass} text-blue-400`} />
    case 'rain':
      return <CloudRain className={`${iconClass} text-blue-500`} />
    case 'snow':
      return <CloudSnow className={`${iconClass} text-blue-200`} />
    case 'showers':
      return <CloudRain className={`${iconClass} text-blue-400`} />
    case 'thunderstorm':
      return <CloudLightning className={`${iconClass} text-yellow-400`} />
  }
}

function formatDayName(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric'
  }).format(date)
}

export function WeatherForecast({ lat, lon, elevation }: WeatherForecastProps) {
  const { t, i18n } = useTranslation()
  const { weather, loading, error } = useWeatherForecast(lat, lon, elevation)

  // Check if offline
  if (!navigator.onLine && !weather) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in border-l-4 border-l-teal-500/50">
        <div className="text-sm font-mono-data text-teal-400/60">
          {t('weather.unavailableOffline')}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Cloud className="w-5 h-5 text-teal-400 animate-pulse" />
          <span className="text-sm font-mono-data text-teal-400/60">
            {t('weather.loading')}
          </span>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in border-l-4 border-l-orange-500/50">
        <div className="text-sm font-mono-data text-orange-400/80">
          {t('weather.loadError')}
        </div>
      </div>
    )
  }

  // Find max wind gust across all days for warning
  const maxGust = Math.max(...weather.days.map((d) => d.windGustsMax))
  const WIND_WARNING_THRESHOLD = 30

  return (
    <div className="card-technical rounded p-6 animate-fade-in">
      <h2 className="text-xl font-display glow-teal mb-1 flex items-center">
        <Cloud className="w-5 h-5 mr-2" />
        {t('weather.title')}
      </h2>
      <p className="text-xs font-mono-data text-teal-400/60 mb-4">
        {t('weather.altitudeAdjusted', {
          elevation: Math.round(weather.elevation)
        })}
      </p>

      {/* 7-day forecast grid */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="grid grid-cols-7 gap-2 min-w-[560px]">
          {weather.days.map((day) => {
            const condition = wmoCodeToCondition(day.weatherCode)
            const isWindy = day.windGustsMax >= WIND_WARNING_THRESHOLD
            const isRainy = day.precipitationSum >= 5

            return (
              <div
                key={day.date}
                className="data-panel p-3 rounded text-center space-y-2"
              >
                {/* Day name */}
                <div className="text-xs font-mono-data text-teal-400 tracking-wider">
                  {formatDayName(day.date, i18n.language)}
                </div>
                <div className="text-[10px] font-mono text-gray-500">
                  {formatDate(day.date, i18n.language)}
                </div>

                {/* Weather icon */}
                <div className="flex justify-center py-1">
                  <WeatherIcon condition={condition} />
                </div>

                {/* Temperature */}
                <div>
                  <div className="text-sm font-mono-data glow-amber">
                    {day.tempMax}°
                  </div>
                  <div className="text-xs font-mono-data text-gray-500">
                    {day.tempMin}°
                  </div>
                </div>

                {/* Wind */}
                <div
                  className={`flex items-center justify-center gap-1 text-xs font-mono-data ${isWindy ? 'text-orange-400' : 'text-gray-400'}`}
                >
                  <Wind className="w-3 h-3" />
                  <span>{day.windSpeedMax}</span>
                </div>

                {/* Precipitation */}
                {day.precipitationSum > 0 && (
                  <div
                    className={`flex items-center justify-center gap-1 text-xs font-mono-data ${isRainy ? 'text-amber-400' : 'text-blue-400/60'}`}
                  >
                    <Droplets className="w-3 h-3" />
                    <span>{day.precipitationSum.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Wind warning */}
      {maxGust >= WIND_WARNING_THRESHOLD && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded bg-orange-500/10 border border-orange-500/30">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span className="text-xs font-mono-data text-orange-300">
            {t('weather.windWarning', { speed: WIND_WARNING_THRESHOLD })}
          </span>
        </div>
      )}

      {/* Attribution */}
      <div className="mt-3 text-[10px] font-mono text-gray-600 text-right">
        {t('weather.poweredBy')}
      </div>
    </div>
  )
}
```

**Step 2: Verify lint passes**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && bun run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/WeatherForecast.tsx
git commit -m "feat: add WeatherForecast component with 7-day forecast display"
```

---

### Task 5: Integrate WeatherForecast into SummitPage

**Files:**
- Modify: `src/pages/SummitPage.tsx:1` (import) and `src/pages/SummitPage.tsx:383-385` (placement)

**Step 1: Add the import**

At the top of `src/pages/SummitPage.tsx`, add after the existing component imports (around line 15):

```typescript
import { WeatherForecast } from '../components/WeatherForecast'
```

**Step 2: Add the component between the map section and the activation info section**

In the JSX, find the closing `</div>` of the "Location Map with Activation Zone" card (around line 383) and the opening of "Activation Information" card (around line 386). Insert between them:

```tsx
            {/* Weather Forecast */}
            <WeatherForecast
              lat={summit.lat}
              lon={summit.lon}
              elevation={summit.altitude}
            />
```

**Step 3: Verify the app builds**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && bun run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add src/pages/SummitPage.tsx
git commit -m "feat: integrate weather forecast card into summit detail page"
```

---

### Task 6: Add Service Worker caching for Open-Meteo API

**Files:**
- Modify: `vite.config.ts:117` (add to runtimeCaching array before the closing `]`)

**Step 1: Add caching rule**

Add this entry to the `runtimeCaching` array in `vite.config.ts`, after the existing Leaflet icons cache entry (around line 116, before the closing `]`):

```typescript
          {
            // Open-Meteo weather API - cache for 1 hour
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'weather-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
```

**Step 2: Verify the app builds**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat: add Service Worker caching for Open-Meteo weather API (1hr TTL)"
```

---

### Task 7: Manual verification

**Step 1: Start dev server and check the feature**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && bun run dev`

1. Open browser to `http://localhost:5173/sota-peak-finder/summit/ja-ns-001`
2. Verify the weather card appears between the map and activation info
3. Verify it shows 7 days of forecast data
4. Verify temperature, wind, precipitation, and weather icons display correctly
5. Verify the wind warning appears if applicable
6. Switch language to English/Japanese and verify translations
7. Open DevTools Network tab: verify the Open-Meteo API call includes elevation parameter
8. Go offline in DevTools: verify "Weather unavailable offline" message appears

**Step 2: Run existing e2e tests to confirm no regressions**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && bun run test:e2e`
Expected: All existing tests pass

---

### Task 8: Add Playwright e2e test for weather card

**Files:**
- Modify: `e2e/app.spec.ts` (add new test)

**Step 1: Add the weather card test**

Add a new test block at the end of the file (before the last closing `})`), or create a new describe block:

```typescript
test.describe('Summit detail page', () => {
  test('shows weather forecast card', async ({ page }) => {
    // Navigate to a known summit (Mount Fuji JA/SO-001)
    await page.goto('/summit/ja-so-001')

    // Wait for summit data to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })

    // Weather card should be visible (may take a moment to fetch)
    await expect(
      page.locator('text=7-Day Weather Forecast').or(page.locator('text=7日間の天気予報'))
    ).toBeVisible({ timeout: 10000 })

    // Should show Open-Meteo attribution
    await expect(page.locator('text=Open-Meteo')).toBeVisible()
  })
})
```

**Step 2: Run the new test**

Run: `cd /Users/matsu/ghq/github.com/matsubo/sota-peak-finder && bun run test:e2e`
Expected: All tests pass including the new weather card test

**Step 3: Commit**

```bash
git add e2e/app.spec.ts
git commit -m "test: add Playwright e2e test for weather forecast on summit page"
```
