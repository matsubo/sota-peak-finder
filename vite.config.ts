import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json";

/**
 * Fingerprint of the SQLite database, used as a cache-busting query parameter.
 *
 * The database is deliberately kept out of the service worker precache (see the
 * workbox config below), so the runtime CacheFirst rule is what serves it. That
 * rule alone would pin users to one copy for its full expiry, so the URL has to
 * change whenever the data does. Hashing the file means a code-only deploy does
 * not invalidate a 53 MB download.
 */
function databaseVersion(): string {
  const dbPath = "./public/data/sota.db";
  if (!existsSync(dbPath)) return "dev";
  return createHash("sha256").update(readFileSync(dbPath)).digest("hex").slice(0, 12);
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __DB_VERSION__: JSON.stringify(databaseVersion()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "SOTA Peak Finder - Find Summits Worldwide",
        short_name: "SOTA Peak Finder",
        version: packageJson.version,
        description:
          "Find nearby SOTA summits worldwide with GPS. 179,000+ summits. Works offline.",
        theme_color: "#2196F3",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // The 53 MB database is deliberately absent here. Precaching it made the
        // service worker download ~58 MB during install, blocking on every
        // deploy including code-only ones. It is fetched on demand instead, by
        // the runtime rule below, which lets the app show download progress.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,wasm}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/sota-peak-finder\/(sitemap.*\.xml|robots\.txt|llms\.txt)$/i],
        runtimeCaching: [
          {
            // SQLite database. The pattern must tolerate the ?v= fingerprint the
            // app appends, so it cannot be anchored with $.
            urlPattern: /\/data\/sota\.db(\?|$)/i,
            handler: "CacheFirst",
            options: {
              cacheName: "sota-database-cache",
              expiration: {
                // Only one copy is ever useful, and each is 53 MB, so superseded
                // versions must be evicted rather than accumulated.
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/www\.googletagmanager\.com\/gtm\.js/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "gtm-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/cyberjapandata2\.gsi\.go\.jp\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gsi-elevation-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "osm-geocoding-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            // OpenStreetMap tiles - cache for offline map viewing
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles-cache",
              expiration: {
                maxEntries: 500, // Cache up to 500 tiles
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Leaflet marker icons from CDN
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/leaflet\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "leaflet-icons-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Open-Meteo weather API - cache for 12 hours
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "weather-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12, // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // SOTA activations API - cache for 12 hours
            urlPattern: /^https:\/\/api2\.sota\.org\.uk\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "sota-activations-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12, // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // SOTA activator logs API - cache for 12 hours
            urlPattern: /^https:\/\/api-db2\.sota\.org\.uk\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "sota-activator-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12, // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  base: "/sota-peak-finder/",
});
