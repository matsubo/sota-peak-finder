#!/usr/bin/env node

/**
 * Generate XML sitemap for all SOTA summit pages
 *
 * Usage:
 *   bun run scripts/generate-summit-sitemap.mjs
 *
 * Output:
 *   public/sitemap-summits.xml (split into chunks if needed)
 */

import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "../public/data/sota.db");
const BASE_URL = "https://matsubo.github.io/sota-peak-finder";
const MAX_URLS_PER_SITEMAP = 50000; // Google's limit

console.log("🗺️  Generating SOTA Summit Sitemaps");
console.log("=====================================\n");

if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Database not found: ${DB_PATH}`);
  console.error("Please run: bun run build:sota-database\n");
  process.exit(1);
}

// Open database
const db = new Database(DB_PATH, { readonly: true });

// Get total summit count
const totalSummits = db.query("SELECT COUNT(*) as count FROM summits").get().count;
console.log(`📊 Total summits: ${totalSummits.toLocaleString()}\n`);

// Calculate number of sitemap files needed
const numSitemaps = Math.ceil(totalSummits / MAX_URLS_PER_SITEMAP);
console.log(`📄 Generating ${numSitemaps} sitemap file(s)...\n`);

// Get all summits ordered by ref for consistent chunking
const summits = db
  .query(`
  SELECT ref, association, region
  FROM summits
  ORDER BY ref
`)
  .all();

// Split into chunks
const chunks = [];
for (let i = 0; i < summits.length; i += MAX_URLS_PER_SITEMAP) {
  chunks.push(summits.slice(i, i + MAX_URLS_PER_SITEMAP));
}

// Generate sitemap files
const sitemapFiles = [];

chunks.forEach((chunk, index) => {
  const sitemapNum = index + 1;
  const filename = numSitemaps === 1 ? "sitemap-summits.xml" : `sitemap-summits-${sitemapNum}.xml`;

  const outputPath = path.join(__dirname, "../public", filename);
  sitemapFiles.push(filename);

  console.log(`📝 Writing ${filename} (${chunk.length.toLocaleString()} URLs)...`);

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  chunk.forEach((summit) => {
    const urlSlug = summit.ref.toLowerCase().replace(/\//g, "-");
    const url = `${BASE_URL}/summit/${urlSlug}`;

    xml += "  <url>\n";
    xml += `    <loc>${url}</loc>\n`;
    xml += "    <changefreq>weekly</changefreq>\n";
    xml += "    <priority>0.7</priority>\n";
    xml += "  </url>\n";
  });

  xml += "</urlset>\n";

  fs.writeFileSync(outputPath, xml);
  console.log(`✅ Generated ${filename}`);
});

// Generate Google sitemap index (sitemap.xml) — always output
console.log("\n📑 Generating sitemap index (sitemap.xml)...");

const today = new Date().toISOString().split("T")[0];
const STATIC_SITEMAP = "sitemap-static.xml";

const indexEntries = [STATIC_SITEMAP, ...sitemapFiles];

let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
indexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

indexEntries.forEach((filename) => {
  indexXml += "  <sitemap>\n";
  indexXml += `    <loc>${BASE_URL}/${filename}</loc>\n`;
  indexXml += `    <lastmod>${today}</lastmod>\n`;
  indexXml += "  </sitemap>\n";
});

indexXml += "</sitemapindex>\n";

// Primary sitemap index referenced from robots.txt
fs.writeFileSync(path.join(__dirname, "../public/sitemap.xml"), indexXml);
console.log(`✅ Generated sitemap.xml`);

// Mirror for backwards compatibility / Search Console submissions
fs.writeFileSync(path.join(__dirname, "../public/sitemap-index.xml"), indexXml);
console.log(`✅ Generated sitemap-index.xml\n`);

db.close();

console.log("📊 Summary");
console.log("=====================================");
console.log(`Total summits: ${totalSummits.toLocaleString()}`);
console.log(`Sitemap files: ${numSitemaps}`);
console.log(`URLs per file: ~${MAX_URLS_PER_SITEMAP.toLocaleString()}`);
console.log("\n✅ Summit sitemaps generated successfully!\n");
console.log("Next steps:");
console.log("  1. Update vite.config.ts to add /summit/:ref route");
console.log("  2. Submit sitemap to Google Search Console");
console.log("  3. Monitor indexation rate\n");
