# Programmatic SEO Strategy - Offline SOTA Summit Finder

## Executive Summary

This document outlines the programmatic SEO implementation for generating **179,527+ individual SOTA summit pages** to capture search traffic from ham radio operators planning activations worldwide.

**Opportunity Size:**
- 179,527 summit pages (Profiles playbook)
- 60+ SOTA associations globally
- 200+ SOTA regions
- Target audience: 100,000+ active SOTA participants worldwide

---

## 1. Business Context

### Product
Offline SOTA Summit Finder - A PWA that helps ham radio operators find and activate SOTA (Summits On The Air) summits using GPS, with full offline functionality.

### Target Audience
- **Primary:** Ham radio operators who participate in SOTA
- **Secondary:** Hikers interested in mountain summits
- **Tertiary:** Radio enthusiasts researching locations

### Conversion Goals
1. Install PWA for offline use
2. Use app during field activations
3. Bookmark specific summits for future activation
4. Share summit links with other operators

---

## 2. Competitive Analysis

### Current Rankings

**"JA/NS-001 SOTA"** (Example summit):
- Position 1-3: sotamaps.org (official)
- Position 4-5: sotlas.org (community)
- Position 6-10: Various blogs and trip reports
- **Opportunity:** Position 3-5 with unique value (offline capability, activation zone detection)

**"SOTA summit near [city]"**:
- Mostly generic results, not SOTA-specific
- **Opportunity:** Strong position 1-3 with location-based pages

**"[Summit name] activation"**:
- Mix of YouTube videos, blog posts, forum discussions
- **Opportunity:** Position 1-5 with authoritative summit data

### What Competitors Do Well
- **SOTAmaps.org:** Comprehensive data, activation logs, spot alerts
- **SOTAwatch:** Real-time activations, community engagement
- **SOTA Goat:** Mobile-first, simple UX

### Our Unique Value Propositions
1. ✅ **Offline-first:** Only app with full offline database and maps
2. ✅ **Activation zone detection:** GPS-based zone validation
3. ✅ **SQLite WASM:** Sub-10ms search, 60% smaller than JSON
4. ✅ **Worldwide coverage:** All 179,527 summits in one database
5. ✅ **Vintage radio aesthetic:** Unique, memorable design

---

## 3. SEO Playbook: Summit Profiles

### Pattern
`/summit/{sota-ref-slug}`

### Examples
- `/summit/ja-ns-001` → Unzendake (Japan)
- `/summit/w6-nc-001` → Mt. Diablo (California, USA)
- `/summit/g-ld-001` → Hampstead Heath (London, UK)
- `/summit/oe-oo-001` → Traunstein (Austria)

### Total Pages
**179,527 summit pages**

### Search Intent Breakdown

| Query Pattern | Monthly Volume (Est.) | Intent | Conversion Potential |
|--------------|----------------------|--------|---------------------|
| "[SOTA ref]" | 50-200 per summit | Lookup reference data | High (planning activation) |
| "[Summit name] SOTA" | 10-100 per summit | Find SOTA details | High |
| "[Summit name] activation" | 5-50 per summit | Trip planning | Very High |
| "[Summit name] coordinates" | 5-30 per summit | GPS navigation | Medium |
| "SOTA summits near [city]" | 100-1000 per city | Discovery | Medium |

**Aggregate Opportunity:**
- Conservative estimate: 10 searches/month per summit average
- Total: 179,527 × 10 = **1,795,270 monthly searches**
- Realistic capture rate: 5-10% = **90,000-180,000 monthly visits**

---

## 4. Data Strategy

### Proprietary Data (✅ Strongest)

Our SQLite database contains:
- Exact GPS coordinates (lat/lon to 6 decimals)
- Altitude in meters
- SOTA points (difficulty rating)
- Total activations count
- Association/Region classification
- Bonus points (where applicable)
- Valid from/to dates

**Unique calculations:**
- Maidenhead grid locator (6-character)
- Activation zone radius (25m)
- Distance/bearing to nearby summits
- Difficulty classification (Easy/Moderate/Hard/Extreme)

### Data Differentiation

vs. **SOTAmaps:**
- ✅ We have: Offline access, activation zone detection, grid calculator
- ❌ They have: Activation logs, spot alerts, historical data

vs. **SOTA database CSV:**
- ✅ We add: Grid locator, nearby summits, difficulty rating, offline maps
- ❌ We lack: Activation history (could add from SOTA API)

**Verdict:** We have sufficient unique value to avoid thin content penalties.

---

## 5. Page Structure & Content

### URL Structure
✅ **Good:** `/summit/ja-ns-001` (subfolder, clean)
❌ **Bad:** `summits.offlineqth.com/ja-ns-001` (subdomain)
❌ **Bad:** `/summit?ref=JA/NS-001` (query parameter)

### Page Template

```html
<!-- Title (60 chars) -->
<title>{Summit Name} ({SOTA Ref}) - {Altitude}m SOTA | Offline Finder</title>

<!-- Meta Description (155 chars) -->
<meta name="description" content="{Summit} ({Ref}) - {Altitude}m SOTA summit in {Association}/{Region} worth {Points} pts. {Activations} activations. GPS coords, zone map, offline access." />

<!-- H1 -->
<h1>{Summit Name}</h1>
<h2>{SOTA Ref} - {Association}/{Region}</h2>

<!-- Content Blocks -->
1. Quick Stats (Altitude, Points, Activations, Grid)
2. GPS Coordinates (Decimal + Grid Locator)
3. Interactive Map with Activation Zone
4. Activation Information (Points, Zone rules, Activity stats)
5. Nearby Summits (Cross-linking to other pages)
6. External Resources (SOTAmaps, Google Maps, OSM)
7. Offline Access Note (PWA install CTA)

<!-- Schema.org -->
<script type="application/ld+json">
{
  "@type": "Mountain",
  "name": "{Summit Name}",
  "identifier": "{SOTA Ref}",
  "geo": { ... },
  "additionalProperty": [ SOTA Points, Activations, Grid ]
}
</script>
```

### Content Uniqueness Strategy

**Per-Page Unique Elements:**
- Summit name, ref, coordinates (obvious)
- Difficulty badge (calculated from points)
- Activity statistics interpretation:
  - 0 activations: "Unactivated summit - be the first!"
  - 1-50: "Moderate activity"
  - 50-100: "Popular summit"
  - 100+: "Very popular with frequent activations"
- Nearby summits list (different for each location)
- Bonus points note (conditional on data)
- External links to specific coordinates

**Template Variations:**
- 4 difficulty tiers (Easy/Moderate/Hard/Extreme) = different text
- Activation count ranges = different encouragement text
- Bonus point summits = additional section
- Regional differences (US vs Japan vs Europe) = localized tips

**Word Count Target:** 800-1200 words per page (mix of template + dynamic)

---

## 6. Internal Linking Architecture

### Hub-and-Spoke Model

**Main Hub:**
- Homepage (`/`) - SOTA Summit Finder main app

**Regional Hubs:** (Future implementation)
- `/association/ja` - All Japan summits (7,211 pages)
- `/association/w6` - All California summits
- `/association/g` - All UK summits

**Individual Spokes:**
- `/summit/ja-ns-001` → Links to:
  - Main hub (/)
  - Regional hub (/association/ja)
  - 10 nearby summits (cross-linking)
  - Help page (/help)

### Avoiding Orphan Pages

✅ **Sitemap Strategy:**
- `sitemap-index.xml` (main index)
- `sitemap-summits-1.xml` (50,000 URLs)
- `sitemap-summits-2.xml` (50,000 URLs)
- `sitemap-summits-3.xml` (50,000 URLs)
- `sitemap-summits-4.xml` (29,527 URLs)

✅ **Breadcrumbs:**
```
Home > SOTA Summits > {Association} > {Summit Name}
```

✅ **Related Links:**
- "Nearby Summits" section (10 links per page)
- "More summits in {Association}" link
- "View all {Region} summits" link

---

## 7. Technical SEO Implementation

### Pre-rendering Strategy

**Problem:** React SPA = No HTML for crawlers

**Solution:** Static site generation (SSG)

**Options:**
1. ❌ Full SSG (179,527 HTML files = slow build, huge deploy)
2. ✅ Hybrid: On-demand SSG with caching
3. ✅ Prerender priority summits (top 10,000 by activations)

**Recommendation:**
- Prerender top 10,000 summits (most activated)
- Use dynamic rendering for remaining 169,527
- Implement Cloudflare Workers for on-demand SSG

### Indexation Plan

**Phase 1: High-Value Summits** (Week 1-2)
- Submit top 10,000 summits (sorted by activations)
- Priority: 1.0 in sitemap
- Monitor indexation rate (target: 70% in 2 weeks)

**Phase 2: Medium-Value Summits** (Week 3-6)
- Submit next 50,000 summits
- Priority: 0.7 in sitemap
- Monitor: 50% indexation target

**Phase 3: Long-Tail Summits** (Week 7-12)
- Submit remaining 119,527 summits
- Priority: 0.5 in sitemap
- Monitor: 30% indexation target

**Crawl Budget Management:**
- Separate sitemaps by priority
- robots.txt: Allow all, specify sitemap index
- Server response time: <200ms (SQLite WASM = ✅)

### Schema Markup

**Mountain Schema:**
```json
{
  "@type": "Mountain",
  "name": "Unzendake",
  "identifier": "JA/NS-001",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 32.7575,
    "longitude": 130.2897,
    "elevation": 1486
  },
  "additionalProperty": [...]
}
```

**Breadcrumb Schema:**
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "/" },
    { "position": 2, "name": "Summits", "item": "/summit" },
    { "position": 3, "name": "JA/NS-001" }
  ]
}
```

---

## 8. Quality Checklist

### Pre-Launch
- [x] Unique title per page
- [x] Unique meta description per page
- [x] H1-H6 hierarchy
- [x] Schema.org markup
- [x] Internal linking (nearby summits)
- [x] Mobile responsive
- [x] Page speed <3s
- [ ] XML sitemap generated
- [ ] robots.txt configured
- [ ] Canonical URLs set

### Post-Launch Monitoring

**Indexation Metrics:**
- Total indexed pages (Google Search Console)
- Indexation rate (% of submitted URLs)
- Crawl errors (404s, server errors)

**Ranking Metrics:**
- Average position for "[SOTA ref]" queries
- Average position for "[summit name] SOTA" queries
- Click-through rate (CTR) from search

**Traffic Metrics:**
- Organic sessions to /summit/* pages
- Bounce rate (<70% target)
- Time on page (>1 min target)

**Conversion Metrics:**
- PWA install rate
- Return visitor rate
- External link clicks (SOTAmaps, Google Maps)

---

## 9. Risk Mitigation

### Thin Content Risk

**Google's Concern:** Auto-generated pages with minimal value

**Our Defense:**
1. ✅ Unique data per page (coordinates, altitude, activations)
2. ✅ Dynamic content (nearby summits, difficulty rating)
3. ✅ Interactive elements (map, activation zone)
4. ✅ External resources (SOTAmaps, Google Maps links)
5. ✅ Offline value proposition (not just SEO bait)

**Precedent:** Wikipedia has 6M+ articles with similar structure. Our pages provide genuine utility.

### Duplicate Content Risk

**Risk:** Multiple summits with same name

**Example:** "Eagle Peak" exists in 50+ associations

**Solution:**
- Unique titles: "Eagle Peak (W6/NC-001)" vs "Eagle Peak (W7/WC-001)"
- Different coordinates, nearby summits, associations
- Canonical URLs prevent self-competition

### Crawl Budget Risk

**Risk:** 179,527 pages = heavy crawl load

**Mitigation:**
- Prioritized sitemap submission
- Fast page load (<200ms SQLite query)
- Noindex very low-value pages (0 activations in obscure regions)
- Monitor crawl stats in GSC

---

## 10. Implementation Timeline

### Week 1-2: Foundation
- [x] Create SummitPage.tsx component
- [x] Add /summit/:ref route
- [ ] Generate XML sitemaps
- [ ] Add robots.txt
- [ ] Deploy to production

### Week 3-4: Indexation
- [ ] Submit sitemaps to Google Search Console
- [ ] Submit to Bing Webmaster Tools
- [ ] Monitor indexation rate
- [ ] Fix any crawl errors

### Week 5-8: Optimization
- [ ] Add association/region hub pages
- [ ] Implement breadcrumbs with schema
- [ ] A/B test page titles/descriptions
- [ ] Add FAQ sections to top summits

### Week 9-12: Expansion
- [ ] Create "Summits near [city]" pages (location playbook)
- [ ] Add difficulty tier pages (1-pt, 4-pt, 8-pt, 10-pt summits)
- [ ] Build association comparison pages
- [ ] Add elevation range pages (peaks >3000m, <1000m)

---

## 11. Success Metrics (6 Month Goals)

### Indexation
- ✅ 70% of high-value summits indexed (top 10,000)
- ✅ 50% of medium-value summits indexed (next 50,000)
- ✅ 30% of long-tail summits indexed (remaining)

### Rankings
- ✅ Position 1-5 for 40% of "{SOTA ref}" queries
- ✅ Position 1-10 for 60% of "{summit name} SOTA" queries
- ✅ Position 1-3 for "SOTA summits near {city}" (100 cities)

### Traffic
- ✅ 50,000 monthly organic sessions to summit pages
- ✅ Average session duration >2 minutes
- ✅ Bounce rate <60%

### Conversions
- ✅ 5% PWA install rate from summit pages
- ✅ 20% click-through to external resources
- ✅ 15% return visitor rate

---

## 12. Next Steps (Action Items)

1. **Generate Sitemaps** (Priority: HIGH)
   ```bash
   bun run scripts/generate-summit-sitemap.mjs
   ```

2. **Update package.json** (Priority: HIGH)
   ```json
   {
     "scripts": {
       "build:sitemaps": "bun run scripts/generate-summit-sitemap.mjs"
     }
   }
   ```

3. **Add robots.txt** (Priority: HIGH)
   ```
   User-agent: *
   Allow: /

   Sitemap: https://matsubo.github.io/offline-qth/sitemap-index.xml
   ```

4. **Submit to Search Engines** (Priority: HIGH)
   - Google Search Console
   - Bing Webmaster Tools

5. **Monitor & Iterate** (Priority: MEDIUM)
   - Weekly: Check indexation rate
   - Monthly: Analyze rankings, traffic, conversions
   - Quarterly: Review strategy, expand to new playbooks

---

## Appendix: Additional Playbook Opportunities

### A. Location Playbook
**Pattern:** `/summits/near/{city-slug}`
- Example: `/summits/near/tokyo`
- Example: `/summits/near/san-francisco`
- **Pages:** 1,000-5,000 (major cities worldwide)
- **Search:** "SOTA summits near Tokyo" (100-500/month)

### B. Difficulty Playbook
**Pattern:** `/summits/difficulty/{points}`
- Example: `/summits/difficulty/10` (extreme summits)
- Example: `/summits/difficulty/1` (easy summits)
- **Pages:** 10 (1pt, 2pt, ..., 10pt)
- **Search:** "10 point SOTA summits" (50-200/month)

### C. Association Hub Playbook
**Pattern:** `/association/{code}`
- Example: `/association/ja` (Japan - 7,211 summits)
- Example: `/association/w6` (California)
- **Pages:** 60+ associations
- **Search:** "JA SOTA summits" (200-1000/month)

### D. Elevation Range Playbook
**Pattern:** `/summits/elevation/{range}`
- Example: `/summits/elevation/3000m-plus` (high peaks)
- Example: `/summits/elevation/under-1000m` (accessible summits)
- **Pages:** 10-20 elevation ranges
- **Search:** "SOTA summits over 3000m" (100-300/month)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-07
**Owner:** JE1WFV
**Status:** ✅ Ready for Implementation
