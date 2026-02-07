import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapPin, Mountain, Navigation, ArrowLeft, ExternalLink } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { LocationMap } from '../components/LocationMap'
import type { SotaSummit, SotaSummitWithDistance } from '../types/location'

interface LocationData {
  lat: number
  lon: number
  prefecture: string
  city: string
  jcc: string
  jcg: string
}

export function LocationPage() {
  const { jcc } = useParams<{ jcc: string }>()
  const [location, setLocation] = useState<LocationData | null>(null)
  const [nearbySota, setNearbySota] = useState<SotaSummitWithDistance[]>([])
  const [gridLocator, setGridLocator] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLocationData() {
      try {
        // Load location data
        const locationResponse = await fetch('/offline-qth/data/location-data.json')
        const locationJson = await locationResponse.json()
        const foundLocation = locationJson.locations.find((loc: LocationData) => loc.jcc === jcc)

        if (!foundLocation) {
          setLoading(false)
          return
        }

        setLocation(foundLocation)

        // Calculate grid locator
        const grid = calculateGridLocator(foundLocation.lat, foundLocation.lon)
        setGridLocator(grid)

        // Load SOTA data and find nearby summits
        const sotaResponse = await fetch('/offline-qth/data/sota-data.json')
        const sotaJson = await sotaResponse.json()

        // Calculate distances and find nearby summits (within 50km)
        const summitsWithDistance = sotaJson.summits.map((summit: SotaSummit) => {
          const distance = calculateDistance(
            foundLocation.lat,
            foundLocation.lon,
            summit.lat,
            summit.lon
          )
          const bearing = calculateBearing(
            foundLocation.lat,
            foundLocation.lon,
            summit.lat,
            summit.lon
          )
          return {
            ...summit,
            distance,
            bearing,
            cardinalBearing: getCardinalBearing(bearing),
            isActivationZone: false, // Not relevant for this page
            verticalDistance: null
          }
        })

        const nearby = summitsWithDistance
          .filter((s: SotaSummitWithDistance) => s.distance < 50)
          .sort((a: SotaSummitWithDistance, b: SotaSummitWithDistance) => a.distance - b.distance)
          .slice(0, 10)

        setNearbySota(nearby)
      } catch (error) {
        console.error('Failed to load location data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLocationData()
  }, [jcc])

  // Calculate Maidenhead Grid Locator (6-digit)
  function calculateGridLocator(lat: number, lon: number): string {
    const adjustedLon = lon + 180
    const adjustedLat = lat + 90

    const field = String.fromCharCode(65 + Math.floor(adjustedLon / 20)) +
                  String.fromCharCode(65 + Math.floor(adjustedLat / 10))

    const square = Math.floor((adjustedLon % 20) / 2).toString() +
                   Math.floor(adjustedLat % 10).toString()

    const subsquare = String.fromCharCode(97 + Math.floor((adjustedLon % 2) * 12)) +
                      String.fromCharCode(97 + Math.floor((adjustedLat % 1) * 24))

    return field + square + subsquare
  }

  // Haversine distance calculation
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Calculate bearing between two points
  function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180)
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon)
    const bearing = Math.atan2(y, x) * 180 / Math.PI
    return (bearing + 360) % 360
  }

  // Convert bearing to cardinal direction
  function getCardinalBearing(bearing: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(bearing / 45) % 8
    return directions[index]
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-teal-400 font-mono-data">Loading...</div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="card-technical rounded p-8 text-center">
            <h1 className="text-2xl font-display glow-amber mb-4">Location Not Found</h1>
            <p className="text-gray-400 mb-6">JCC {jcc} was not found in the database.</p>
            <Link to="/" className="btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const pageTitle = `${location.city}のJCC/JCG番号 (${location.jcc}/${location.jcg}) | オフラインQTH`
  const pageDescription = `${location.city}(${location.prefecture})のJCC番号は${location.jcc}、JCG番号は${location.jcg}です。位置情報、グリッドロケーター、周辺SOTA山頂情報を掲載。オフライン対応。`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://matsubo.github.io/offline-qth/location/${jcc}`} />

        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Place",
            "name": location.city,
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": location.lat,
              "longitude": location.lon
            },
            "address": {
              "@type": "PostalAddress",
              "addressRegion": location.prefecture,
              "addressLocality": location.city
            },
            "additionalProperty": [
              {
                "@type": "PropertyValue",
                "name": "JCC",
                "value": location.jcc
              },
              {
                "@type": "PropertyValue",
                "name": "JCG",
                "value": location.jcg
              },
              {
                "@type": "PropertyValue",
                "name": "Grid Locator",
                "value": gridLocator
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen p-4 sm:p-6 md:p-8 relative z-10">
        <div className="mx-auto max-w-4xl">
          {/* Header with breadcrumbs */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-teal-400 hover:text-teal-300 font-mono-data text-sm mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to QTH Locator
            </Link>
          </div>

          {/* Page Title */}
          <header className="mb-8 animate-fade-in">
            <div className="card-technical rounded-none border-l-4 border-l-amber-500 p-6 corner-accent">
              <div className="text-xs font-mono-data glow-teal mb-2 tracking-wider">
                LOCATION_DATA // {location.prefecture}
              </div>
              <h1 className="text-4xl md:text-5xl font-display glow-amber mb-2">
                {location.city}
              </h1>
              <div className="text-xs font-mono text-teal-400/60 mt-2">
                JCC {location.jcc} {'// '}JCG {location.jcg} {'// '}GRID {gridLocator}
              </div>
            </div>
          </header>

          <main className="space-y-6">
            {/* Quick Info Card */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Quick Reference
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">JCC NUMBER</div>
                  <div className="text-2xl font-mono-data glow-amber">{location.jcc}</div>
                </div>

                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">JCG NUMBER</div>
                  <div className="text-2xl font-mono-data glow-amber">{location.jcg}</div>
                </div>

                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">GRID LOCATOR</div>
                  <div className="text-2xl font-mono-data glow-green">{gridLocator}</div>
                </div>

                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">PREFECTURE</div>
                  <div className="text-xl font-sans-clean text-gray-200">{location.prefecture}</div>
                </div>

                <div className="data-panel p-4 rounded md:col-span-2">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">COORDINATES</div>
                  <div className="text-lg font-mono-data glow-green">
                    {location.lat.toFixed(6)}°N, {location.lon.toFixed(6)}°E
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                <Navigation className="w-5 h-5 mr-2" />
                Location Map
              </h2>
              <div className="h-80 rounded overflow-hidden">
                <LocationMap
                  latitude={location.lat}
                  longitude={location.lon}
                  sotaSummits={nearbySota as never}
                />
              </div>
            </div>

            {/* Nearby SOTA Summits */}
            {nearbySota.length > 0 && (
              <div className="card-technical rounded p-6 animate-fade-in">
                <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                  <Mountain className="w-5 h-5 mr-2" />
                  Nearby SOTA Summits
                  <span className="ml-2 text-sm text-gray-400 font-mono-data">
                    (within 50km)
                  </span>
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-teal-500/30">
                        <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">REF</th>
                        <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">NAME</th>
                        <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">DISTANCE</th>
                        <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">ALTITUDE</th>
                        <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">POINTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nearbySota.map((summit) => (
                        <tr key={summit.ref} className="border-b border-gray-700/50 hover:bg-teal-500/5">
                          <td className="py-3 px-2">
                            <Link
                              to={`/sota/${summit.ref.toLowerCase().replace('/', '-')}`}
                              className="font-mono-data text-amber-400 hover:text-amber-300"
                            >
                              {summit.ref}
                            </Link>
                          </td>
                          <td className="py-3 px-2 font-sans-clean text-gray-200">{summit.name}</td>
                          <td className="py-3 px-2 text-right font-mono-data text-green-400">
                            {summit.distance.toFixed(1)} km
                          </td>
                          <td className="py-3 px-2 text-right font-mono-data text-gray-300">
                            {summit.altitude}m
                          </td>
                          <td className="py-3 px-2 text-right font-mono-data text-amber-400">
                            {summit.points}pt
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Operating Information */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4">Operating from {location.city}</h2>

              <div className="space-y-4 text-gray-300 font-sans-clean">
                <section>
                  <h3 className="text-lg font-display text-amber-400 mb-2">QSO Logging</h3>
                  <p className="mb-2">
                    When operating from {location.city}, use the following information for your log entries:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>JCC:</strong> {location.jcc} (Japan Century City)</li>
                    <li><strong>JCG:</strong> {location.jcg} (Japan Century Gun)</li>
                    <li><strong>Grid:</strong> {gridLocator} (Maidenhead Locator)</li>
                    <li><strong>Prefecture:</strong> {location.prefecture}</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-display text-amber-400 mb-2">Award Programs</h3>
                  <p>
                    This location counts toward JCC and JCG award programs.
                    {nearbySota.length > 0 && (
                      <>{' '}Additionally, there {nearbySota.length === 1 ? 'is' : 'are'} {nearbySota.length} SOTA summit{nearbySota.length !== 1 ? 's' : ''} within 50km for mountain activation opportunities.</>
                    )}
                  </p>
                </section>

                {nearbySota.length > 0 && (
                  <section>
                    <h3 className="text-lg font-display text-amber-400 mb-2">Mountain Operations</h3>
                    <p>
                      For SOTA activations near {location.city}, the nearest summit is{' '}
                      <Link
                        to={`/sota/${nearbySota[0].ref.toLowerCase().replace('/', '-')}`}
                        className="text-green-400 hover:text-green-300 underline"
                      >
                        {nearbySota[0].name} ({nearbySota[0].ref})
                      </Link>
                      , located {nearbySota[0].distance.toFixed(1)}km away at {nearbySota[0].altitude}m altitude
                      and worth {nearbySota[0].points} points.
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="text-lg font-display text-amber-400 mb-2">Offline Access</h3>
                  <p>
                    This page is available offline through our PWA. Install the app on your device
                    to access JCC/JCG/SOTA information even without internet connection during field operations.
                  </p>
                </section>
              </div>
            </div>

            {/* External Resources */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4">External Resources</h2>

              <div className="space-y-3">
                <a
                  href={`https://www.google.com/maps?q=${location.lat},${location.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 rounded bg-black/30 border border-teal-500/30 hover:border-teal-500/60 hover:bg-teal-500/10 transition-all"
                >
                  <ExternalLink className="w-5 h-5 text-teal-400 mr-3" />
                  <div>
                    <div className="font-mono-data text-sm text-gray-200">View on Google Maps</div>
                    <div className="text-xs text-gray-400">External navigation and street view</div>
                  </div>
                </a>

                <a
                  href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lon}&zoom=12`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 rounded bg-black/30 border border-teal-500/30 hover:border-teal-500/60 hover:bg-teal-500/10 transition-all"
                >
                  <ExternalLink className="w-5 h-5 text-teal-400 mr-3" />
                  <div>
                    <div className="font-mono-data text-sm text-gray-200">View on OpenStreetMap</div>
                    <div className="text-xs text-gray-400">Open source mapping data</div>
                  </div>
                </a>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-8 text-center text-gray-500 text-sm font-mono-data">
            <div className="mb-2">
              Data Last Updated: {new Date().toISOString().split('T')[0]}
            </div>
            <div>
              <Link to="/" className="text-teal-400 hover:text-teal-300">
                ← Back to QTH Locator Home
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}
