#!/usr/bin/env node

/**
 * Build SQLite database from worldwide SOTA CSV
 *
 * Usage:
 *   bun run scripts/build-sota-database.mjs [path-to-csv]
 *   Default CSV path: /tmp/sota-summits-worldwide.csv
 *
 * Output:
 *   public/data/sota.db
 */

import { Database } from 'bun:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_PATH = process.argv[2] || '/tmp/sota-summits-worldwide.csv';
const OUTPUT_PATH = path.join(__dirname, '../public/data/sota.db');
const BATCH_SIZE = 1000;

console.log('🏔️  Building SOTA SQLite Database');
console.log('=====================================\n');
console.log(`Input CSV:  ${CSV_PATH}`);
console.log(`Output DB:  ${OUTPUT_PATH}\n`);

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Remove existing database
if (fs.existsSync(OUTPUT_PATH)) {
  fs.unlinkSync(OUTPUT_PATH);
  console.log('🗑️  Removed existing database');
}

// Read CSV file
if (!fs.existsSync(CSV_PATH)) {
  console.error(`❌ CSV file not found: ${CSV_PATH}`);
  console.error('\nPlease download the worldwide SOTA CSV from:');
  console.error('https://www.sotadata.org.uk/\n');
  process.exit(1);
}

const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = csvContent.split('\n');
console.log(`📄 Read ${lines.length.toLocaleString()} lines from CSV\n`);

// Initialize database
console.log('🔧 Creating database schema...');
const db = new Database(OUTPUT_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA synchronous = NORMAL');

// Create schema
db.exec(`
  CREATE TABLE summits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    altitude INTEGER NOT NULL,
    points INTEGER NOT NULL,
    activations INTEGER DEFAULT 0,
    bonus INTEGER,
    association TEXT,
    region TEXT,
    valid_from TEXT,
    valid_to TEXT
  );

  CREATE INDEX idx_summits_ref ON summits(ref);
  CREATE INDEX idx_summits_coords ON summits(lat, lon);
  CREATE INDEX idx_summits_association ON summits(association);
`);

// Create R*Tree spatial index
db.exec(`
  CREATE VIRTUAL TABLE summits_idx USING rtree(
    id,
    minLat, maxLat,
    minLon, maxLon
  );
`);

console.log('✅ Schema created\n');

// Prepare insert statements
const insertSummit = db.prepare(`
  INSERT INTO summits (ref, name, lat, lon, altitude, points, activations, bonus, association, region, valid_from, valid_to)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertSpatialIndex = db.prepare(`
  INSERT INTO summits_idx (id, minLat, maxLat, minLon, maxLon)
  VALUES (?, ?, ?, ?, ?)
`);

// Parse CSV and insert data
console.log('📥 Importing summits...');
let processed = 0;
let skipped = 0;
let errors = 0;

// Skip header lines (first 2 lines in SOTA CSV)
const dataLines = lines.slice(2);

// Begin transaction for better performance
const insertBatch = db.transaction((summitBatch) => {
  for (const summit of summitBatch) {
    try {
      const result = insertSummit.run(
        summit.ref,
        summit.name,
        summit.lat,
        summit.lon,
        summit.altitude,
        summit.points,
        summit.activations,
        summit.bonus,
        summit.association,
        summit.region,
        summit.validFrom,
        summit.validTo
      );

      const summitId = result.lastInsertRowid;

      // Insert into spatial index (point represented as bbox with same min/max)
      insertSpatialIndex.run(
        summitId,
        summit.lat,
        summit.lat,
        summit.lon,
        summit.lon
      );

      processed++;
    } catch (error) {
      console.error(`Error inserting ${summit.ref}: ${error.message}`);
      errors++;
    }
  }
});

// Process CSV lines in batches
let batch = [];
let lineNumber = 3; // Actual data starts at line 3

for (const line of dataLines) {
  if (!line.trim()) {
    continue;
  }

  try {
    // Parse CSV line (handle quoted fields with commas)
    const parts = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());

    if (parts.length < 11) {
      skipped++;
      continue;
    }

    const [
      summitCode,
      associationName,
      regionName,
      summitName,
      altM,
      altFt,
      gridRef1,
      gridRef2,
      longitude,
      latitude,
      points,
      bonusPoints,
      validFrom,
      validTo,
      activationCount
    ] = parts;

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const altitude = parseInt(altM, 10);
    const pts = parseInt(points, 10);

    // Validate numeric values
    if (isNaN(lat) || isNaN(lon) || isNaN(altitude) || isNaN(pts)) {
      skipped++;
      continue;
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      skipped++;
      continue;
    }

    batch.push({
      ref: summitCode,
      name: summitName.replace(/^"|"$/g, ''),
      lat,
      lon,
      altitude,
      points: pts,
      activations: activationCount ? parseInt(activationCount, 10) : 0,
      bonus: bonusPoints ? parseInt(bonusPoints, 10) : null,
      association: associationName,
      region: regionName,
      validFrom: validFrom || null,
      validTo: validTo || null
    });

    // Insert batch when it reaches BATCH_SIZE
    if (batch.length >= BATCH_SIZE) {
      insertBatch(batch);
      batch = [];

      // Progress indicator
      if (processed % 10000 === 0) {
        process.stdout.write(`\r   Processed: ${processed.toLocaleString()} summits...`);
      }
    }
  } catch (error) {
    console.error(`\nLine ${lineNumber}: Parse error - ${error.message}`);
    skipped++;
  }

  lineNumber++;
}

// Insert remaining batch
if (batch.length > 0) {
  insertBatch(batch);
}

console.log(`\r   Processed: ${processed.toLocaleString()} summits    `);
console.log('\n✅ Import complete\n');

// Optimize database
console.log('🔧 Optimizing database...');
// Switch from WAL to DELETE journal mode for portable single-file database
// WAL mode requires separate -wal/-shm files which don't work with sqlite3_deserialize
db.exec('PRAGMA journal_mode = DELETE');
db.exec('VACUUM');
db.exec('ANALYZE');

// Get statistics
const stats = db.query('SELECT COUNT(*) as count FROM summits').get();
const dbSize = fs.statSync(OUTPUT_PATH).size;
const dbSizeMB = (dbSize / 1024 / 1024).toFixed(2);

// Get association breakdown
const associations = db.query(`
  SELECT association, COUNT(*) as count
  FROM summits
  GROUP BY association
  ORDER BY count DESC
  LIMIT 10
`).all();

db.close();

console.log('✅ Database optimized\n');
console.log('📊 Statistics');
console.log('=====================================');
console.log(`Total summits:    ${stats.count.toLocaleString()}`);
console.log(`Skipped lines:    ${skipped.toLocaleString()}`);
console.log(`Errors:           ${errors.toLocaleString()}`);
console.log(`Database size:    ${dbSizeMB} MB`);
console.log(`\nTop associations:`);
associations.forEach(a => {
  console.log(`  ${a.association.padEnd(20)} ${a.count.toLocaleString()}`);
});
console.log('\n✅ Database ready at:', OUTPUT_PATH);
console.log('\nNext steps:');
console.log('  1. Run: bun run dev');
console.log('  2. Test the app with worldwide SOTA data\n');
