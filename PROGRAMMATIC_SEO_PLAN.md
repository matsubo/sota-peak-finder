# Programmatic SEO Implementation Plan for Offline QTH

## Executive Summary

Implement a **Locations Playbook** to create 9,000+ SEO-optimized pages targeting amateur radio operators searching for JCC/JCG/SOTA information by location.

**Business Goal**: Increase organic traffic from amateur radio operators searching for specific location information, improve PWA installations from search traffic.

---

## Opportunity Analysis

### Search Patterns Identified

| Pattern | Example Queries | Volume | Competition |
|---------|----------------|--------|-------------|
| "JCC [city]" | "JCC 札幌", "JCC 東京" | Medium | Low |
| "JCG [area]" | "JCG 北海道", "JCG 千代田区" | Medium | Low |
| "SOTA [mountain]" | "SOTA 茶臼山", "SOTA JA/AC-001" | High | Medium |
| "[city] アマチュア無線" | "札幌 アマチュア無線 QTH" | Low | Medium |
| "[mountain] 無線 運用" | "富士山 無線 運用", "高尾山 SOTA" | Medium | High |

**Total Addressable Pages**: 9,000+
- 47 prefectures
- 1,741 cities/municipalities (JCC)
- 7,211 SOTA summits

### Competitive Landscape

**Current ranking pages:**
- JARL official databases (high authority but poor UX)
- Amateur radio club websites (scattered, outdated)
- SOTA mapping website (SOTAMaps.org - strong competitor)

**Your Competitive Advantages:**
1. **Offline functionality** - unique value proposition
2. **Integrated data** - JCC + JCG + SOTA in one place
3. **GPS-based** - automatic location detection
4. **Mobile-optimized** - PWA for field use

---

## Implementation Strategy

### Page Architecture

```
/area/[prefecture-slug]/          ← Prefecture hub pages (47 pages)
/location/[jcc]/                   ← City/municipality pages (1,741 pages)
/sota/[sota-ref]/                  ← SOTA summit pages (7,211 pages)
```

#### Hub & Spoke Model

```
Homepage
  ├─ /area/hokkaido (hub)
  │   ├─ /location/1101 (札幌市中央区)
  │   ├─ /location/1102 (札幌市北区)
  │   └─ ... (all Hokkaido cities)
  │
  ├─ /area/tokyo (hub)
  │   ├─ /location/1301 (千代田区)
  │   └─ ... (all Tokyo areas)
  │
  └─ /sota/ja-ac-001 (Chausuyama)
      └─ Links to nearby cities
```

---

## Page Templates

### 1. Prefecture Hub Page Template

**URL**: `/area/{prefecture-slug}`
**Example**: `/area/hokkaido`

**SEO Elements:**
- **Title**: `北海道のJCC/JCG/SOTA一覧 | オフラインQTH`
- **Meta Description**: `北海道内の全{N}市区町村のJCC/JCG番号と{M}ヶ所のSOTA山頂情報を掲載。アマチュア無線の移動運用に便利なオフライン対応QTH検索ツール。`
- **H1**: `北海道 - アマチュア無線QTH情報`

**Content Sections:**
1. **Overview** - Prefecture introduction, statistics
2. **Cities Table** - Sortable table of all cities with JCC/JCG
3. **SOTA Summits** - Top 10 SOTA peaks in the prefecture
4. **Map** - Interactive map showing all locations
5. **Related Resources** - Links to other prefectures
6. **FAQ** - Common questions about operating in this prefecture

**Unique Value:**
- Aggregated statistics (total cities, SOTA peaks)
- Sortable/filterable tables
- Download offline data button
- Operating tips for the region

---

### 2. City/Municipality Page Template

**URL**: `/location/{jcc}`
**Example**: `/location/1101` (札幌市中央区)

**SEO Elements:**
- **Title**: `札幌市中央区のJCC/JCG番号 (1101/11001) | オフラインQTH`
- **Meta Description**: `札幌市中央区(北海道)のJCC番号は1101、JCG番号は11001です。位置情報、グリッドロケーター、周辺SOTA山頂情報を掲載。オフライン対応。`
- **H1**: `札幌市中央区 (北海道)`

**Content Sections:**
1. **Quick Info Card**
   - JCC: 1101
   - JCG: 11001
   - Grid Locator: PM95xr
   - Prefecture: 北海道
   - Coordinates: 43.0554°N, 141.3409°E

2. **Location Map**
   - Interactive map centered on city
   - Nearby SOTA peaks marked

3. **Nearby SOTA Summits** (within 50km)
   - Table with distance, points, altitude
   - Links to each summit page

4. **Operating Information**
   - Common operating locations
   - Repeater information (if available)
   - Popular frequencies

5. **Nearby Cities**
   - Adjacent municipalities with JCC/JCG

6. **How to Use This Information**
   - Instructions for logging QSOs
   - Award program information

**Unique Value:**
- Precise coordinates for GPS navigation
- Nearby SOTA summits for planning mountain operations
- Offline-capable page for field reference

**Schema Markup:**
```json
{
  "@context": "https://schema.org",
  "@type": "Place",
  "name": "札幌市中央区",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 43.0554,
    "longitude": 141.3409
  },
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "北海道",
    "addressLocality": "札幌市中央区"
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "JCC",
      "value": "1101"
    },
    {
      "@type": "PropertyValue",
      "name": "JCG",
      "value": "11001"
    }
  ]
}
```

---

### 3. SOTA Summit Page Template

**URL**: `/sota/{sota-ref}`
**Example**: `/sota/ja-ac-001` (Chausuyama)

**SEO Elements:**
- **Title**: `茶臼山 (JA/AC-001) - SOTA 8ポイント山頂 | オフラインQTH`
- **Meta Description**: `茶臼山(JA/AC-001)の詳細情報。標高1,415m、8ポイント、これまでに53回のアクティベーション。位置情報、アクセス、周辺JCC/JCG情報を掲載。`
- **H1**: `茶臼山 (Chausuyama) - JA/AC-001`

**Content Sections:**
1. **Summit Overview**
   - SOTA Reference: JA/AC-001
   - Name (Japanese + Romaji)
   - Altitude: 1,415m
   - Points: 8
   - Total Activations: 53
   - Bonus Points: 3

2. **Location Information**
   - Coordinates: 35.2276°N, 137.6555°E
   - Grid Locator: PM95xf
   - Nearest City: [City with JCC/JCG]
   - Prefecture: 長野県

3. **Interactive Map**
   - Summit location
   - Activation zone (25m altitude band)
   - Nearby cities and roads

4. **Operating Information**
   - Recommended frequencies
   - Typical operating conditions
   - Activation reports (if available)
   - Best seasons for activation

5. **Nearby JCC/JCG Areas**
   - Cities visible from summit
   - Useful for log accuracy

6. **Activation Tips**
   - Trail information
   - Equipment recommendations
   - Safety notes

**Unique Value:**
- Integration with JCC/JCG data (unique to your app)
- Offline availability for mountain use
- Activation zone visualization

**Schema Markup:**
```json
{
  "@context": "https://schema.org",
  "@type": "Mountain",
  "name": "茶臼山",
  "alternateName": "Chausuyama",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 35.2276,
    "longitude": 137.6555,
    "elevation": 1415
  },
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "SOTA Reference",
      "value": "JA/AC-001"
    },
    {
      "@type": "PropertyValue",
      "name": "Points",
      "value": "8"
    }
  ]
}
```

---

## Technical Implementation

### File Structure

```
src/
├── pages/
│   ├── Help.tsx (existing)
│   ├── LocationPage.tsx (new - city/JCC pages)
│   ├── PrefecturePage.tsx (new - prefecture hub pages)
│   └── SotaPage.tsx (new - SOTA summit pages)
├── templates/
│   ├── LocationPageTemplate.tsx
│   ├── PrefecturePageTemplate.tsx
│   └── SotaPageTemplate.tsx
├── utils/
│   ├── seo.ts (new - metadata generation)
│   ├── urlHelpers.ts (new - slug generation)
│   └── pageData.ts (new - data fetching for pages)
└── main.tsx (add new routes)

public/
├── data/
│   ├── location-data.json (existing)
│   ├── sota-data.json (existing)
│   └── prefecture-data.json (new - aggregated prefecture stats)
```

### URL Slug Generation

**Prefecture slugs:**
```typescript
const prefectureSlugMap = {
  '北海道': 'hokkaido',
  '東京都': 'tokyo',
  '大阪府': 'osaka',
  // ... all 47 prefectures
}
```

**SOTA ref normalization:**
```
JA/AC-001 → ja-ac-001 (lowercase, forward slash removed)
```

### Route Configuration

```typescript
// src/main.tsx
<Routes>
  <Route path="/" element={<App />} />
  <Route path="/help" element={<Help />} />

  {/* New programmatic routes */}
  <Route path="/area/:prefecture" element={<PrefecturePage />} />
  <Route path="/location/:jcc" element={<LocationPage />} />
  <Route path="/sota/:sotaRef" element={<SotaPage />} />
</Routes>
```

### Data Pre-processing

Generate aggregated data for prefecture pages:

```bash
# scripts/generate-prefecture-data.ts
# Output: public/data/prefecture-data.json
[
  {
    "slug": "hokkaido",
    "name": "北海道",
    "cityCount": 179,
    "sotaCount": 342,
    "cities": [
      { "jcc": "1101", "name": "札幌市中央区", ... },
      ...
    ]
  }
]
```

---

## Internal Linking Strategy

### Hub Links (from Homepage)
- "JCC/JCG検索" section with prefecture dropdown
- "SOTA山頂検索" section with region links
- Popular locations carousel

### Spoke Links (from Prefecture pages)
- Table of all cities (links to `/location/{jcc}`)
- Featured SOTA summits (links to `/sota/{ref}`)
- Breadcrumbs: Home > 北海道

### Cross-Links (from City pages)
- Nearby cities (geographical proximity)
- Same prefecture cities
- SOTA summits within 50km radius
- Breadcrumbs: Home > 北海道 > 札幌市中央区

### SOTA to City Links
- Nearest city (for JCC/JCG reference)
- Cities within line-of-sight
- Same prefecture summits

---

## SEO Optimization

### Meta Tags Template

```typescript
// src/utils/seo.ts
export function generateLocationMeta(location: Location) {
  return {
    title: `${location.city}のJCC/JCG番号 (${location.jcc}/${location.jcg}) | オフラインQTH`,
    description: `${location.city}(${location.prefecture})のJCC番号は${location.jcc}、JCG番号は${location.jcg}です。位置情報、グリッドロケーター、周辺SOTA山頂情報を掲載。オフライン対応。`,
    keywords: [
      location.city,
      location.prefecture,
      `JCC ${location.jcc}`,
      `JCG ${location.jcg}`,
      'アマチュア無線',
      'QTH',
      'SOTA'
    ],
    openGraph: {
      title: `${location.city} - JCC/JCG番号`,
      description: `JCC: ${location.jcc} | JCG: ${location.jcg}`,
      type: 'website'
    }
  }
}
```

### Sitemap Generation

Create static sitemap at build time:

```xml
<!-- public/sitemap-locations.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://matsubo.github.io/sota-peak-finder/location/1101</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <!-- ... all 1,741 cities -->
</urlset>
```

**Sitemap Index:**
```xml
<!-- public/sitemap.xml -->
<sitemapindex>
  <sitemap>
    <loc>https://matsubo.github.io/sota-peak-finder/sitemap-main.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://matsubo.github.io/sota-peak-finder/sitemap-prefectures.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://matsubo.github.io/sota-peak-finder/sitemap-locations.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://matsubo.github.io/sota-peak-finder/sitemap-sota.xml</loc>
  </sitemap>
</sitemapindex>
```

### Robots.txt

```
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://matsubo.github.io/sota-peak-finder/sitemap.xml
```

---

## Content Uniqueness Strategy

**Problem**: How to make 9,000 pages unique and valuable?

### Dynamic Content Elements

1. **Geographic Context**
   - Distance to nearest SOTA summits
   - Nearby cities and their JCC/JCG
   - Prefecture statistics
   - Grid locator calculation

2. **Statistical Insights**
   - "This city is one of {N} municipalities in {prefecture}"
   - "Nearest SOTA summit: {name} ({distance}km away)"
   - "{M} amateur radio operators in this area" (if data available)

3. **Conditional Content**
   ```typescript
   {location.sotaSummits.length > 0 && (
     <section>
       <h2>Nearby SOTA Summits for Mountain Operations</h2>
       {/* List summits */}
     </section>
   )}
   ```

4. **User-Generated Content (Future)**
   - Operating reports
   - QSL card images
   - Photos from activations
   - Comments/tips from operators

---

## Indexation Strategy

### Phased Rollout

**Phase 1: Prefecture Pages** (47 pages)
- Highest quality, most hand-crafted content
- Submitted to Search Console immediately
- Link from homepage

**Phase 2: Major Cities** (~200 pages)
- Cities with population > 100,000
- Higher search volume
- Priority indexation

**Phase 3: All Cities** (1,741 pages)
- Full JCC/JCG coverage
- Submitted in batches via sitemap

**Phase 4: SOTA Summits** (7,211 pages)
- High activation count first
- Then all summits
- May need selective indexing

### Crawl Budget Management

**High Priority** (indexed):
- Prefecture pages: 47
- Major cities: 200
- Popular SOTA summits (>10 activations): ~1,000
- Total: ~1,250 pages

**Medium Priority** (indexed if crawled):
- All other cities: 1,541
- Remaining SOTA: ~6,200
- Total: ~7,750 pages

**Strategy:**
- Use `<link rel="canonical">` to avoid duplicate content
- Monitor Search Console for indexation rate
- Adjust based on crawl stats

---

## Performance Optimization

### Static Generation

**Pre-render all pages at build time:**
```bash
# Vite static site generation plugin
vite-plugin-ssg
```

**Benefits:**
- Instant page loads (no client-side data fetching)
- SEO-friendly (all content in HTML)
- Works offline (PWA caching)

### Page Size Targets

| Page Type | Target Size | Notes |
|-----------|-------------|-------|
| Prefecture | < 100KB | Includes table data |
| City | < 50KB | Minimal, focused content |
| SOTA | < 50KB | Similar to city pages |

### Lazy Loading

- Maps load on scroll/interaction
- Images lazy-loaded
- Non-critical data deferred

---

## Success Metrics

### 3-Month Goals

**Indexation:**
- 1,000+ pages indexed
- 80%+ indexation rate for priority pages

**Traffic:**
- 5,000+ organic sessions/month
- 50+ different location pages receiving traffic

**Engagement:**
- Avg session duration > 2 minutes
- Bounce rate < 60%
- 10%+ PWA installation rate from SEO traffic

**Rankings:**
- Top 10 for "{major city} JCC" queries
- Top 5 for branded "{mountain} SOTA JA/XX-XXX" queries

### 6-Month Goals

**Traffic:**
- 20,000+ organic sessions/month
- 500+ different pages receiving traffic

**Conversions:**
- 500+ PWA installations/month from SEO
- 1,000+ return visitors

---

## Risk Mitigation

### Thin Content Penalty Prevention

**Strategies:**
1. **Minimum content threshold**: Each page must have 300+ words
2. **Unique images**: Generate custom maps for each location
3. **Dynamic data**: Calculate distances, grid locators, etc.
4. **Noindex low-value pages**: Cities with no SOTA nearby

### Quality Checks

**Pre-launch:**
- [ ] Manual review of 10 sample pages per type
- [ ] Lighthouse SEO score > 90
- [ ] Unique title/description verification
- [ ] Schema validation

**Post-launch monitoring:**
- [ ] Weekly Search Console checks
- [ ] Coverage issue alerts
- [ ] Ranking tracker for key queries

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Create page templates
- [ ] Set up routing
- [ ] Generate prefecture data
- [ ] Build 3 prototype pages (1 of each type)

### Week 3-4: Content Generation
- [ ] Implement all prefecture pages (47)
- [ ] Generate location pages (1,741)
- [ ] Generate SOTA pages (7,211)
- [ ] Create sitemaps

### Week 5: SEO & Performance
- [ ] Add schema markup
- [ ] Optimize meta tags
- [ ] Performance testing
- [ ] PWA integration

### Week 6: Launch & Monitor
- [ ] Deploy to GitHub Pages
- [ ] Submit sitemaps to Search Console
- [ ] Set up analytics tracking
- [ ] Monitor indexation

---

## Next Steps

1. **Approve this plan** - Confirm strategy and scope
2. **Review data availability** - Ensure JCC/JCG/SOTA data is complete
3. **Set up development** - Create feature branch
4. **Build prototype** - Implement 1 page of each type
5. **User testing** - Get feedback from amateur radio operators
6. **Full rollout** - Generate all 9,000 pages

---

## Questions for Consideration

1. **Data completeness**: Do you have complete JCC/JCG data for all 1,741 municipalities in `location-data.json`?
2. **SOTA accuracy**: Is the SOTA data current and complete (7,211 summits)?
3. **Additional data**: Do you have repeater information, club contacts, or other local data to enhance pages?
4. **Multilingual**: Should we create English versions of these pages (double the page count)?
5. **User-generated content**: Want to add a system for operators to submit activation reports?

---

**Let's build a programmatic SEO powerhouse for the amateur radio community!**

73, and happy coding! 📻⛰️
