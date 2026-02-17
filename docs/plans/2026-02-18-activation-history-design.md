# Recent Activations & Activator History

## Overview

Add recent activation logs to each summit detail page, and a dedicated activator page showing a callsign's full activation history. Callsigns on the summit page link to the activator page.

## Data Sources

### Summit Activations
- **Endpoint**: `GET https://api2.sota.org.uk/api/activations/{association}/{summitCode}`
- **Response fields**: `id`, `userId`, `activationDate`, `ownCallsign`, `qsos`
- **Sort**: Most recent first (API default)
- **Limit**: Display 10 most recent

### Activator History
- **Endpoint**: `GET https://api-db2.sota.org.uk/logs/activator/{userId}/{limit}/{page}`
- **Response fields**: `ActivationId`, `ActivationDate`, `OwnCallsign`, `SummitCode`, `Summit`, `Points`, `BonusPoints`, `Total`, `QSOs`, band/mode QSO breakdowns
- **Note**: Requires numeric `userId` (available from summit activation records)

## Feature 1: Recent Activations on Summit Page

### Component: `RecentActivations`
- Placed on summit detail page between weather forecast and activation info
- Shows table: Date | Callsign (link) | QSOs
- Callsign links to `/activator/:userId`
- Loading, error, and empty states (matches weather component pattern)
- Vintage radio aesthetic consistent with existing design

### Hook: `useActivations(summitRef)`
- Parses summit ref into association + code
- Fetches from SOTA API
- Returns `{ activations, loading, error }`

## Feature 2: Activator Page

### Route: `/activator/:userId`
- New page component `ActivatorPage`

### UI Sections
1. **Header**: Callsign display (extracted from first record)
2. **Summary stats**: Total activations, total QSOs, total points
3. **Activation table**: Date | Summit (link to `/summit/:ref`) | QSOs | Points

### Hook: `useActivatorHistory(userId)`
- Fetches from `api-db2.sota.org.uk`
- Returns `{ activations, callsign, loading, error }`

## Caching Strategy

Both API endpoints cached via Service Worker (Workbox):
- **Strategy**: CacheFirst
- **TTL**: 12 hours
- **Max entries**: 50 each

Added to `runtimeCaching` in `vite.config.ts`.

## Files to Create/Modify

### New files
- `src/components/RecentActivations.tsx` — activation list component
- `src/pages/ActivatorPage.tsx` — activator history page
- `src/hooks/useActivations.ts` — summit activation data hook
- `src/hooks/useActivatorHistory.ts` — activator history data hook

### Modified files
- `src/main.tsx` — add `/activator/:userId` route
- `src/pages/SummitPage.tsx` — integrate `RecentActivations` component
- `src/utils/api.ts` — add API fetch functions
- `vite.config.ts` — add Service Worker cache rules for both APIs
- `public/locales/en/translation.json` — English translations
- `public/locales/ja/translation.json` — Japanese translations

## i18n Keys

```
activations.title: "Recent Activations"
activations.date: "Date"
activations.callsign: "Callsign"
activations.qsos: "QSOs"
activations.noActivations: "No activations recorded"
activations.loading: "Loading activations..."
activations.error: "Failed to load activations"

activator.title: "Activator"
activator.totalActivations: "Activations"
activator.totalQsos: "Total QSOs"
activator.totalPoints: "Total Points"
activator.summit: "Summit"
activator.points: "Points"
activator.loading: "Loading activator history..."
activator.error: "Failed to load activator history"
activator.noHistory: "No activation history found"
```
