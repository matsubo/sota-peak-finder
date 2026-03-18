# Offline Map Caching Guide

## How Map Caching Works

The Offline QTH PWA now **caches map tiles** for offline use, but with important limitations you should understand.

### ✅ What Gets Cached

1. **OpenStreetMap Tiles** (up to 500 tiles, 30 days)
   - Map tiles from `tile.openstreetmap.org`
   - Cached automatically as you browse the map

2. **Leaflet Marker Icons** (1 year)
   - Map marker images from CDN
   - Location markers, SOTA markers, etc.

### ⚠️ Important Limitations

**Map tiles are cached ONLY when you view them while ONLINE.**

This is called **"Runtime Caching"** - tiles are saved as you use the app:

```
First visit (online)  → Tiles downloaded → Cached for 30 days
Later visit (offline) → Tiles loaded from cache ✅
New area (offline)    → No tiles available ❌
```

### 🗺️ How to Prepare for Offline Use

**Before going to the mountains:**

1. **While connected to WiFi**, open the app
2. **Navigate to your target area** on the map
3. **Zoom in and pan around** to load tiles for the area
4. **The app will cache up to 500 tiles** automatically
5. Now you can use those areas offline!

**Example workflow for SOTA activation:**

```bash
1. Check your activation plan (which mountain?)
2. Open app at home with WiFi
3. Search for that mountain's JCC/JCG area
4. View the map and zoom in/out (loads tiles)
5. Pan around nearby areas
6. Go offline → Those tiles are now cached!
```

### 📊 Cache Storage Limits

| Resource | Max Entries | Cache Duration |
|----------|-------------|----------------|
| Map tiles | 500 tiles | 30 days |
| Leaflet icons | 20 files | 1 year |
| GSI elevation | 100 requests | 30 days |
| OSM geocoding | 100 requests | 7 days |

**Note:** 500 tiles covers roughly:
- Zoom level 13: ~5km × 5km area
- Zoom level 14: ~2.5km × 2.5km area
- Zoom level 15: ~1.2km × 1.2km area

### 🔍 How to Check If Maps Are Cached

1. **Open browser DevTools** (F12)
2. Go to **Application** → **Cache Storage**
3. Look for **`osm-tiles-cache`**
4. You'll see all cached map tiles

Alternatively, just **turn on airplane mode** and see if the map still loads!

### 🚨 What Happens When Offline Without Cached Tiles?

When you're offline and view an area you haven't cached:

- ⚠️ **Warning banner** appears: "OFFLINE - Showing cached tiles only"
- 🔲 **Gray placeholder** shown for missing tiles
- 📍 **Markers and data still work** (JCC/JCG/SOTA info)
- 🧭 **Coordinates still accurate** (GPS doesn't need internet)

**You can still:**
- ✅ See your GPS coordinates
- ✅ See JCC/JCG/SOTA information
- ✅ Calculate grid locator
- ✅ View nearby summits (with distance/bearing)

**You cannot:**
- ❌ Load new map tiles
- ❌ View areas you haven't cached

---

## Advanced: Pre-Caching Specific Regions

For power users who want to **pre-cache entire regions** before going offline:

### Option 1: Manual Pre-Caching Script

Create a script to visit all tiles in a bounding box:

```javascript
// Pre-cache tiles for a specific area
async function precacheTiles(north, south, east, west, zoom) {
  const tiles = []

  for (let z = zoom - 1; z <= zoom + 1; z++) {
    const n = Math.floor((1 - Math.log(Math.tan(north * Math.PI / 180) +
      1 / Math.cos(north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z))
    const s = Math.floor((1 - Math.log(Math.tan(south * Math.PI / 180) +
      1 / Math.cos(south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z))
    const w = Math.floor((west + 180) / 360 * Math.pow(2, z))
    const e = Math.floor((east + 180) / 360 * Math.pow(2, z))

    for (let x = w; x <= e; x++) {
      for (let y = n; y <= s; y++) {
        tiles.push(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`)
      }
    }
  }

  // Fetch all tiles (they'll be cached by service worker)
  for (const tile of tiles) {
    await fetch(tile)
    await new Promise(r => setTimeout(r, 100)) // Rate limiting
  }

  console.log(`Pre-cached ${tiles.length} tiles`)
}

// Example: Pre-cache Mt. Fuji area
precacheTiles(35.4, 35.3, 138.8, 138.7, 14)
```

### Option 2: Offline-First Map Alternative

For true offline-first experience, consider:

1. **Static map images** - Pre-generate map images for common areas
2. **MBTiles format** - Download and serve tiles locally
3. **Vector tiles** - Smaller file size, better offline performance

---

## Technical Details

### Service Worker Configuration

The map tile caching is configured in `vite.config.ts`:

```typescript
{
  urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'osm-tiles-cache',
    expiration: {
      maxEntries: 500,
      maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    },
    cacheableResponse: {
      statuses: [0, 200]
    }
  }
}
```

**Strategy: CacheFirst**
- Check cache first
- If found, return cached tile
- If not found, fetch from network (if online)
- Newly fetched tiles are cached

**Why 500 tiles?**
- Balance between storage usage and coverage
- ~10-20MB of storage (depending on zoom)
- Covers typical operating area for SOTA activation

### Browser Storage Limits

Most browsers allow:
- **Chrome/Edge**: ~60% of disk space
- **Firefox**: ~50% of disk space
- **Safari**: ~1GB per origin

The 500-tile limit is conservative to avoid hitting quota issues.

---

## Troubleshooting

### Maps not loading offline?

1. **Did you view the area while online first?**
   - Tiles are only cached after viewing them online

2. **Check cache storage:**
   - DevTools → Application → Cache Storage → `osm-tiles-cache`

3. **Clear cache and retry:**
   - DevTools → Application → Clear storage
   - Revisit areas while online

### Running out of cache space?

Increase `maxEntries` in `vite.config.ts`:

```typescript
maxEntries: 1000, // Double the cache size
```

Then rebuild:
```bash
bun run build
```

### Want to cache different map provider?

Change the tile URL in `src/components/LocationMap.tsx`:

```tsx
// Option 1: Japan GSI (国土地理院)
url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"

// Option 2: Stamen Terrain (better for mountains)
url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png"
```

And update the cache pattern in `vite.config.ts` accordingly.

---

## FAQ

**Q: Do I need internet to use the app?**
A: No! But maps will only show areas you've previously viewed while online.

**Q: How long are tiles cached?**
A: 30 days. After that, they're re-fetched when you go online.

**Q: Can I pre-download all of Japan?**
A: Technically yes, but it would be millions of tiles (~100GB+). Not practical.

**Q: What if I'm in a new area I haven't cached?**
A: You'll still get GPS coordinates, JCC/JCG, grid locator, and SOTA info. Just no map background.

**Q: Does this work on iOS?**
A: Yes! iOS Safari supports PWA caching.

**Q: Can I use this in airplane mode?**
A: Yes! That's the whole point. Just make sure you've cached the area first.

---

## Best Practices for Mountain Operations

1. **Plan your route at home** (with WiFi)
2. **View all areas on the map** you'll visit
3. **Zoom in to detail level** you need
4. **Test offline mode** before leaving (airplane mode)
5. **Keep app installed** (don't clear cache)
6. **Re-cache after 30 days** if revisiting same area

---

**73 and safe DX!** 📻⛰️

For questions or issues, open an issue at:
https://github.com/matsubo/sota-peak-finder/issues
