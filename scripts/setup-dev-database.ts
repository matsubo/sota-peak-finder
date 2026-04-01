#!/usr/bin/env bun

/**
 * Setup SOTA database for local development
 * Downloads the latest SOTA CSV and builds the database
 */

import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";
import { $ } from "bun";

const CSV_URL = "https://storage.sota.org.uk/summitslist.csv";
const CSV_PATH = "/tmp/sota-summits-worldwide.csv";
const DB_PATH = path.join(import.meta.dir, "../public/data/sota.db");

console.log("🏔️  Setting up SOTA database for local development");
console.log("==================================================\n");

try {
  // Download latest SOTA CSV
  console.log("📥 Downloading latest SOTA database from official source...");
  console.log(`Source: ${CSV_URL}\n`);

  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to download CSV: ${response.statusText}`);
  }

  const csvData = await response.arrayBuffer();
  await Bun.write(CSV_PATH, csvData);

  const csvSize = (csvData.byteLength / 1024 / 1024).toFixed(2);
  console.log(`✅ Download complete (${csvSize} MB)\n`);

  // Build database
  console.log("🔨 Building SOTA database...");
  console.log("This may take a minute...\n");

  // Run the build script
  await $`bun run build:sota`.quiet();

  if (!fs.existsSync(DB_PATH)) {
    throw new Error("Database build failed - sota.db not found");
  }

  const dbStats = fs.statSync(DB_PATH);
  const dbSize = (dbStats.size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Database built successfully (${dbSize} MB)\n`);

  // Get database statistics
  console.log("📊 Database Statistics:");
  console.log("======================");

  const db = new Database(DB_PATH);
  const result = db.query("SELECT COUNT(*) as count FROM summits").get() as { count: number };
  const summitCount = result.count.toLocaleString();

  console.log(`Total summits: ${summitCount}`);
  console.log(`Database size: ${dbSize} MB`);

  db.close();

  console.log("\n✅ Setup complete! You can now run:");
  console.log("   bun run dev\n");

  process.exit(0);
} catch (error) {
  console.error("\n❌ Setup failed:");
  console.error(error instanceof Error ? error.message : String(error));
  console.error("\nPlease check:");
  console.error("1. Internet connection is available");
  console.error("2. Bun is properly installed (bun --version)");
  console.error("3. Disk space is sufficient (~100 MB free)\n");
  process.exit(1);
}
