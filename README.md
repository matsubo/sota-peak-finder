# SOTA Peak Finder

[![GitHub Pages](https://img.shields.io/badge/demo-live-success)](https://matsubo.github.io/sota-peak-finder/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Find SOTA Summits Worldwide—Works Offline Anywhere**

**Page: https://matsubo.github.io/sota-peak-finder/**

A Progressive Web App (PWA) for SOTA (Summits On The Air) activators to find nearby summits using GPS, even without internet connection.

**Coverage: Worldwide (179,000+ summits)**

## 🌟 Features

- **Worldwide Coverage**: Access to 179,000+ SOTA summits across all associations and regions
- **Browse & Filter**: Search summits by association, region, altitude, points, and more
- **GPS-Powered Search**: Automatically finds nearest summits (up to 20 within 50km)
- **Fully Offline**: Works without internet after first visit - perfect for mountain activations
- **PWA Support**: Install as an app on your home screen
- **Detailed Summit Information**: Reference codes, names, coordinates, altitude, points, distance, bearing, and activation zone detection
- **Fast Search**: SQLite WASM + R*Tree spatial indexing for sub-10ms query speed
- **Interactive Maps**: Click anywhere on the map to find nearby summits at that location
- **Grid Locator**: Automatic Maidenhead Locator System (6-digit) calculation
- **JCC/JCG Support**: Japanese location reference codes included
- **Lightweight**: 44MB compact database with efficient caching

## 🚀 Demo

**[https://matsubo.github.io/sota-peak-finder/](https://matsubo.github.io/sota-peak-finder/)**

All files are cached on first visit for complete offline access.

## 📱 How to Use

### Homepage - Dashboard & Insights

1. Visit [https://matsubo.github.io/sota-peak-finder/](https://matsubo.github.io/sota-peak-finder/)
2. Explore global SOTA statistics:
   - **Highest/Lowest Peaks**: Discover extreme summits
   - **Most Valuable Summits**: See top point-value targets
   - **Most Activated**: Popular summits by activation count
   - **Unactivated Gems**: Find virgin peaks to activate
   - **Association Distribution**: See worldwide SOTA coverage
3. Click the **"Activate GPS Finder"** hero banner for location-based search
4. Or click **"Browse All Summits"** to filter the complete database

### Browse All Summits

1. Navigate to **Browse** page via header or homepage link
2. Filter summits by:
   - Association (e.g., JA, W, G)
   - Region (e.g., Kanto, California)
   - Altitude range
   - Points value
   - Search by reference or name
3. Sort by name, altitude, points, or activations
4. Click any summit for detailed information

### Find Nearest Summits (GPS Mode)

1. Click the hero banner or navigate to **Nearby Summits** via the header
2. Tap "ACQUIRE CURRENT LOCATION" button
3. Allow location access when prompted
4. View summit information:
   - GPS coordinates and accuracy
   - Altitude (GPS or elevation API)
   - Grid Locator (Maidenhead 6-digit)
   - JCC/JCG codes (Japan only)
   - Nearest 20 SOTA summits with reference, distance, altitude, points, bearing, and activation zone status
5. Click anywhere on the map to find summits at that location

### Install as PWA (Recommended)

#### iOS (Safari)
1. Open the site in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

#### Android (Chrome)
1. Open the site in Chrome
2. Tap Menu → "Add to Home Screen"

## 🛠️ Development

### Setup

```bash
# Install dependencies
bun install
```

### Run Locally

```bash
# Start development server
bun run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
# Build
bun run build

# Preview production build
bun run preview
```

### Database Management

```bash
# Rebuild SOTA database
bun run build:sota

# Generate sitemaps
bun run build:sitemaps

# Build everything (database + sitemaps + app)
bun run build:all
```

## 📊 Technical Details

### Data Sources
- **SOTA Database**: https://storage.sota.org.uk/summitslist.csv (~24 MB CSV, 179,527 summits)
- **Built Database**: ~44 MB with R*Tree spatial index
- **Update Frequency**: Periodic updates from official SOTA database

### Architecture
- **SQLite WASM**: Official `@sqlite.org/sqlite-wasm` (v3.52.0) for in-browser database
- **Spatial Indexing**: R*Tree for fast bounding box queries
- **Distance Calculation**: Haversine formula in JavaScript after spatial filter
- **Caching Strategy**: Service Worker with CacheFirst (90 days, 60MB limit)

**Performance:**
- Sub-10ms query times for finding nearby summits
- 60% smaller than JSON format
- Instant offline access after first load

### Important Notes
- **Journal Mode**: Always use `PRAGMA journal_mode = DELETE` (WAL breaks `sqlite3_deserialize`)
- **WASM Files**: Must be in `public/wasm/` directory
- **OPFS**: Requires COOP/COEP headers (not compatible with standard GitHub Pages)

## 🎨 Design System

**Technical Cartography** - Inspired by vintage radio equipment and topographic maps.

### Typography
- **Headers**: Rajdhani (technical, bold)
- **Data/Numbers**: JetBrains Mono (monospace for coordinates)
- **Body**: DM Sans (readable sans-serif)

### Color Palette
- `--bg-base: rgb(12, 16, 24)` - Base background
- `--accent-amber: rgb(255, 169, 51)` - Primary accent (buttons, important data)
- `--accent-teal: rgb(51, 204, 204)` - Grid lines, labels
- `--accent-green: rgb(102, 255, 153)` - GPS coordinates, status

### Visual Effects
- Contour line patterns (50px spacing)
- Diagonal grid lines (100px spacing)
- CRT scanlines (4px spacing)
- Neon glow effects
- Technical corner accents

## 🚢 Deployment

### GitHub Pages

Automated deployment via GitHub Actions on push to `main` branch.

#### Setup
1. Create GitHub repository
2. Push code:
   ```bash
   git remote add origin https://github.com/username/sota-peak-finder.git
   git push -u origin main
   ```
3. Configure GitHub Pages:
   - Settings → Pages
   - Source: **GitHub Actions**
4. Automatic deployment on every push

The workflow is defined in `.github/workflows/deploy.yml`.

## 🧪 Tech Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **PWA**: Service Worker (vite-plugin-pwa), manifest.json
- **Database**: SQLite WASM (@sqlite.org/sqlite-wasm)
- **Location**: Geolocation API
- **Deployment**: GitHub Pages + GitHub Actions
- **SEO**: Structured data (JSON-LD), Open Graph, Twitter Cards, Programmatic sitemaps

## 📄 License

MIT License

## 🤝 Contributing

Pull requests, issues, and feedback are welcome!

We especially welcome contributions to expand the JCC/JCG database coverage.

## 🏔️ About SOTA

SOTA (Summits On The Air) is an amateur radio award program where operators activate summits and earn points based on summit difficulty. Learn more at [sota.org.uk](https://www.sota.org.uk/).

### Grid Locator
The Maidenhead Locator System is a global coordinate system used in amateur radio, particularly for VHF/UHF contests and DX. A 6-character code (e.g., PM95vr) represents a specific location on Earth.

## 👨‍💻 Author

**JE1WFV**
- Twitter: [@je1wfv](https://x.com/je1wfv)
- GitHub: [matsubo/sota-peak-finder](https://github.com/matsubo/sota-peak-finder)

## 73!

Good DX & Happy Trails!
