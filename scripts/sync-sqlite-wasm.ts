#!/usr/bin/env bun

/**
 * Sync SQLite WASM assets from node_modules into public/wasm/
 *
 * `sotaDatabase.ts` calls `sqlite3InitModule` with
 * `locateFile: (file) => `${basePath}wasm/${file}``, so the runtime loads
 * `public/wasm/sqlite3.wasm` while the JS glue comes from node_modules.
 * When @sqlite.org/sqlite-wasm is upgraded, a stale committed copy makes the
 * glue request symbols the old binary does not export (e.g.
 * `sqlite3_bind_zeroblob`) and database init fails at runtime — silently, since
 * the page still renders. Keeping both halves in lockstep prevents that.
 */

import fs from "node:fs";
import path from "node:path";

const ASSETS = ["sqlite3.wasm", "sqlite3-opfs-async-proxy.js"];

const SRC_DIR = path.join(import.meta.dir, "../node_modules/@sqlite.org/sqlite-wasm/dist");
const DEST_DIR = path.join(import.meta.dir, "../public/wasm");

try {
  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`@sqlite.org/sqlite-wasm not found at ${SRC_DIR}. Run \`bun install\` first.`);
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  const copied = ASSETS.map((asset) => {
    const src = path.join(SRC_DIR, asset);
    if (!fs.existsSync(src)) {
      throw new Error(`Expected asset missing from the package: ${src}`);
    }
    fs.copyFileSync(src, path.join(DEST_DIR, asset));
    return `${asset} (${(fs.statSync(src).size / 1024).toFixed(1)} KB)`;
  });

  console.log("✅ Synced SQLite WASM assets to public/wasm/");
  copied.forEach((entry) => {
    console.log(`   - ${entry}`);
  });
} catch (error) {
  console.error("❌ Failed to sync SQLite WASM assets:", error);
  process.exit(1);
}
