# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup: downloads SOTA CSV and builds SQLite database
bun run setup

# Development server (http://localhost:5173)
bun run dev

# Production build
bun run build

# Lint
bun run lint
bun run lint:fix

# E2E tests (requires dev server running or will auto-start it)
bun run test:e2e
bun run test:e2e:ui   # with Playwright UI

# Database management
curl -L -o /tmp/sota-summits-worldwide.csv https://storage.sota.org.uk/summitslist.csv
bun run build:sota       # rebuild SQLite DB from CSV
bun run build:sitemaps   # regenerate sitemap XMLs
bun run build:all        # full: sota DB + sitemaps + app build
```

**Critical**: `public/data/sota.db` is NOT in git. Run `bun run setup` before any development or testing.

## Architecture

### Overview

PWA for finding SOTA (Summits On The Air) amateur radio summits via GPS. 179,000+ worldwide summits. Fully offline after first load.

- **Stack**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Database**: SQLite WASM (`@sqlite.org/sqlite-wasm`) loaded into memory via `sqlite3_deserialize`
- **PWA**: `vite-plugin-pwa` + Workbox service worker, CacheFirst for DB (90 days, 60MB limit)
- **i18n**: i18next, English + Japanese
- **Maps**: Leaflet + react-leaflet with OpenStreetMap tiles
- **Deploy**: GitHub Pages at `/sota-peak-finder/`, auto-deployed on push to `main`

### Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `App.tsx` | Dashboard with global SOTA stats |
| `/nearby` | `NearbyPage.tsx` | GPS-based summit finder |
| `/summits` | `SummitsListPage.tsx` | Browseable/filterable summit list |
| `/summit/:ref` | `SummitPage.tsx` | Summit detail with weather + activation history |
| `/activator/:userId` | `ActivatorPage.tsx` | Activator log history with pagination |
| `/help` | `Help.tsx` | Help page |

Summit refs in URLs use lowercase with `-` replacing `/` (e.g., `JA/SO-001` → `/summit/ja-so-001`).

### Database Layer

`src/utils/sotaDatabase.ts` — singleton `SotaDatabase` class:
- `init()` — fetches `public/data/sota.db`, loads into in-memory SQLite via `sqlite3_deserialize`
- `findNearby(lat, lon, radiusKm, limit)` — R\*Tree bounding box query + Haversine distance sort in JS
- `searchSummits(filters)` — dynamic WHERE clause with pagination
- `getDashboardStats()`, `getStats()`, `getMetadata()` — dashboard queries

**SQLite WASM constraints**:
- Always use `PRAGMA journal_mode = DELETE` (WAL breaks `sqlite3_deserialize`)
- WASM files must live in `public/wasm/`
- OPFS requires COOP/COEP headers; this app uses in-memory mode instead

### External APIs

- `https://api2.sota.org.uk/api/activations/{assoc}/{code}` — recent summit activations
- `https://api-db2.sota.org.uk/logs/activator/{userId}/{limit}/1` — activator history
- `https://api.open-meteo.com/` — weather forecast (cached 12h)
- `https://cyberjapandata2.gsi.go.jp/` — Japan elevation API
- `https://nominatim.openstreetmap.org/` — reverse geocoding

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useGeolocation` | Browser GPS API wrapper |
| `useSotaData` | Database init + nearby summit search |
| `useLocationData` | JCC/JCG Japan location data |
| `useActivations` | Summit activation history fetch |
| `useActivatorHistory` | Activator log fetch with pagination |
| `useSummitFilters` | Filter state for `SummitsListPage` |
| `useWeatherForecast` | Open-Meteo 7-day forecast |

### Design System

"Technical Cartography" aesthetic — dark background with amber/teal/green accent colors:
- `--bg-base: rgb(12, 16, 24)` — base dark background
- `--accent-amber: rgb(255, 169, 51)` — primary accent (buttons, key data)
- `--accent-teal: rgb(51, 204, 204)` — labels, grid lines
- `--accent-green: rgb(102, 255, 153)` — GPS coordinates, status

Typography: Rajdhani (headers), JetBrains Mono (data/numbers), DM Sans (body).

CSS classes: `card-technical`, `data-panel`, `font-display`, `font-mono-data`, `animate-fade-in`.

### Database Build Script

`scripts/build-sota-database.mjs` reads the SOTA CSV (skipping first 2 header lines), inserts into:
- `summits` table with standard indexes
- `summits_idx` virtual R\*Tree table for spatial queries
- `metadata` table with build date

Outputs to `public/data/sota.db`. Database is rebuilt weekly via GitHub Actions.

### Pre-commit Hooks

Husky + lint-staged runs `eslint --fix` on staged `.ts`/`.tsx` files before each commit.
