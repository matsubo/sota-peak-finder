import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import packageJson from './package.json'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'SOTA Peak Finder - Find Summits Worldwide',
        short_name: 'SOTA Peak Finder',
        description: 'Find nearby SOTA summits worldwide with GPS. 179,000+ summits. Works offline.',
        theme_color: '#2196F3',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,wasm,db}'],
        maximumFileSizeToCacheInBytes: 60 * 1024 * 1024, // 60 MB for SQLite database
        runtimeCaching: [
          {
            // SQLite database - cache first with long expiration
            urlPattern: /\/data\/sota\.db$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sota-database-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/www\.googletagmanager\.com\/gtm\.js/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'gtm-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/cyberjapandata2\.gsi\.go\.jp\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gsi-elevation-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'osm-geocoding-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          },
          {
            // OpenStreetMap tiles - cache for offline map viewing
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles-cache',
              expiration: {
                maxEntries: 500, // Cache up to 500 tiles
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Leaflet marker icons from CDN
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/leaflet\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leaflet-icons-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Open-Meteo weather API - cache for 12 hours
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'weather-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12 // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // SOTA activations API - cache for 12 hours
            urlPattern: /^https:\/\/api2\.sota\.org\.uk\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sota-activations-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12 // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // SOTA activator logs API - cache for 12 hours
            urlPattern: /^https:\/\/api-db2\.sota\.org\.uk\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sota-activator-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12 // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  base: '/sota-peak-finder/'
})
