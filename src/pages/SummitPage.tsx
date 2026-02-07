import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapPin, Mountain, Navigation, ArrowLeft, ExternalLink, Award } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { LocationMap } from '../components/LocationMap'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { sotaDatabase } from '../utils/sotaDatabase'
import type { SotaSummit, SotaSummitWithDistance } from '../types/location'
import { calculateGridLocator } from '../utils/coordinate'
import { getAssociationFlag } from '../utils/countryFlags'

export function SummitPage() {
  const { ref } = useParams<{ ref: string }>()
  const { i18n } = useTranslation()
  const [summit, setSummit] = useState<SotaSummit | null>(null)
  const [nearbySummits, setNearbySummits] = useState<SotaSummitWithDistance[]>([])
  const [gridLocator, setGridLocator] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [sotaCount, setSotaCount] = useState<number | null>(null)
  const [sotaBuildDate, setSotaBuildDate] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load database stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        await sotaDatabase.init()
        const stats = await sotaDatabase.getStats()
        const metadata = await sotaDatabase.getMetadata()
        setSotaCount(stats.totalSummits)
        if (metadata.buildDate) {
          const date = new Date(metadata.buildDate)
          const formatted = new Intl.DateTimeFormat(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }).format(date)
          setSotaBuildDate(formatted)
        }
      } catch (error) {
        console.error('Failed to load database stats:', error)
      }
    }
    loadStats()
  }, [i18n.language])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    async function loadSummitData() {
      try {
        if (!ref) return

        // Convert URL format (ja-ns-001) back to SOTA ref (JA/NS-001)
        // SOTA format: AA/BB-NNN (last dash before number stays, others become slashes)
        const parts = ref.toUpperCase().split('-')
        const number = parts.pop() // Remove last part (the number)
        const sotaRef = parts.join('/') + '-' + number // Join rest with /, add dash before number

        await sotaDatabase.init()
        const summitData = await sotaDatabase.findByRef(sotaRef)

        if (!summitData) {
          setLoading(false)
          return
        }

        setSummit(summitData)
        setGridLocator(calculateGridLocator(summitData.lat, summitData.lon))

        // Find nearby summits (within 50km)
        const nearby = await sotaDatabase.findNearby(
          summitData.lat,
          summitData.lon,
          50,
          10
        )

        // Filter out the current summit and add distance info
        const nearbySummitsWithDistance: SotaSummitWithDistance[] = nearby
          .filter(s => s.ref !== summitData.ref)
          .map(s => ({
            ...s,
            distance: s.distance * 1000, // Convert km to meters
            bearing: 0, // Calculate if needed
            cardinalBearing: 'N',
            isActivationZone: false,
            verticalDistance: null
          }))

        setNearbySummits(nearbySummitsWithDistance)
      } catch (error) {
        console.error('Failed to load summit data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSummitData()
  }, [ref])

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-teal-400 font-mono-data">Loading summit data...</div>
      </div>
    )
  }

  if (!summit) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="card-technical rounded p-8 text-center">
            <h1 className="text-2xl font-display glow-amber mb-4">Summit Not Found</h1>
            <p className="text-gray-400 mb-6">SOTA reference {ref?.toUpperCase().replace(/-/g, '/')} was not found in the database.</p>
            <Link to="/" className="btn-primary inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const pageTitle = `${summit.name} (${summit.ref}) - ${summit.altitude}m SOTA Summit | Offline SOTA Finder`
  const pageDescription = `${summit.name} (${summit.ref}) - ${summit.altitude}m SOTA summit in ${summit.association}/${summit.region} worth ${summit.points} points. ${summit.activations} total activations. GPS coordinates, activation zone map, and offline access for ham radio operators.`

  // Difficulty badge based on points
  const getDifficultyLabel = (points: number) => {
    if (points >= 10) return { label: 'Extreme', color: 'text-red-400' }
    if (points >= 8) return { label: 'Very Hard', color: 'text-orange-400' }
    if (points >= 4) return { label: 'Moderate', color: 'text-cyan-400' }
    return { label: 'Easy', color: 'text-amber-400' }
  }

  const difficulty = getDifficultyLabel(summit.points)

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://matsubo.github.io/offline-qth/summit/${summit.ref.toLowerCase().replace(/\//g, '-')}`} />

        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Mountain",
            "name": summit.name,
            "identifier": summit.ref,
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": summit.lat,
              "longitude": summit.lon,
              "elevation": summit.altitude
            },
            "address": {
              "@type": "PostalAddress",
              "addressRegion": summit.region,
              "addressCountry": summit.association
            },
            "additionalProperty": [
              {
                "@type": "PropertyValue",
                "name": "SOTA Points",
                "value": summit.points
              },
              {
                "@type": "PropertyValue",
                "name": "Total Activations",
                "value": summit.activations
              },
              {
                "@type": "PropertyValue",
                "name": "Grid Locator",
                "value": gridLocator
              },
              {
                "@type": "PropertyValue",
                "name": "SOTA Association",
                "value": summit.association
              },
              {
                "@type": "PropertyValue",
                "name": "SOTA Region",
                "value": summit.region
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen p-3 sm:p-4 md:p-5 relative z-10">
        <div className="mx-auto max-w-6xl">
          <Header isOnline={isOnline} />

          {/* Summit Title Card */}
          <div className="mb-8 animate-fade-in">
            <div className="card-technical rounded-none border-l-4 border-l-amber-500 p-6 corner-accent">
              <div className="text-xs font-mono-data glow-teal mb-2 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">{getAssociationFlag(summit.association || '')}</span>
                  <span>SOTA_SUMMIT // {summit.association}/{summit.region}</span>
                </span>
                <span className={`${difficulty.color} font-bold`}>{difficulty.label}</span>
              </div>
              <h1
                className="text-4xl md:text-5xl font-display glow-amber mb-2 cursor-pointer hover:text-amber-300 transition-colors"
                onClick={scrollToTop}
                title="Click to scroll to top"
              >
                {summit.name}
              </h1>
              <div className="text-xl font-mono-data text-green-400 mt-2">
                {summit.ref}
              </div>
              <div className="text-xs font-mono text-teal-400/60 mt-2">
                {summit.altitude}m {'// '}{summit.points} pts {'// '}GRID {gridLocator}
              </div>
            </div>
          </div>

          <main className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <div className="card-technical rounded p-4">
                <div className="text-xs font-mono text-teal-400/60 mb-1">ALTITUDE</div>
                <div className="text-2xl font-mono-data glow-green">{summit.altitude}m</div>
              </div>

              <div className="card-technical rounded p-4">
                <div className="text-xs font-mono text-teal-400/60 mb-1">SOTA POINTS</div>
                <div className="text-2xl font-mono-data glow-amber">{summit.points} pt</div>
              </div>

              <div className="card-technical rounded p-4">
                <div className="text-xs font-mono text-teal-400/60 mb-1">ACTIVATIONS</div>
                <div className="text-2xl font-mono-data text-cyan-400">{summit.activations}</div>
              </div>

              <div className="card-technical rounded p-4">
                <div className="text-xs font-mono text-teal-400/60 mb-1">GRID</div>
                <div className="text-xl font-mono-data glow-green">{gridLocator}</div>
              </div>
            </div>

            {/* Coordinates Card */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                GPS Coordinates
              </h2>

              <div className="space-y-3">
                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">DECIMAL DEGREES</div>
                  <div className="text-lg font-mono-data glow-green">
                    {summit.lat.toFixed(6)}°N, {summit.lon.toFixed(6)}°E
                  </div>
                </div>

                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">MAIDENHEAD LOCATOR</div>
                  <div className="text-lg font-mono-data glow-green">{gridLocator}</div>
                </div>

                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">ASSOCIATION / REGION</div>
                  <div className="text-lg font-sans-clean text-gray-200 flex items-center gap-2">
                    <span className="text-2xl">{getAssociationFlag(summit.association || '')}</span>
                    <span>{summit.association} / {summit.region}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map with Activation Zone */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                <Navigation className="w-5 h-5 mr-2" />
                Summit Location & Nearby Peaks
              </h2>
              <p className="text-sm text-gray-400 mb-4 font-mono-data">
                Shows this summit (center) and nearest 10 SOTA summits within 50km
              </p>
              <div className="h-96 rounded overflow-hidden">
                <LocationMap
                  latitude={summit.lat}
                  longitude={summit.lon}
                  sotaSummits={[
                    // Current summit with distance 0
                    {
                      ...summit,
                      distance: 0,
                      bearing: 0,
                      cardinalBearing: 'N',
                      isActivationZone: true
                    } as unknown as typeof summit,
                    // Nearby summits
                    ...nearbySummits
                  ]}
                />
              </div>
            </div>

            {/* Activation Information */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Activation Information
              </h2>

              <div className="space-y-4 text-gray-300">
                <section>
                  <h3 className="text-lg font-display text-amber-400 mb-2">Points Value</h3>
                  <p>
                    This summit is worth <strong className="text-green-400">{summit.points} points</strong> for both activators and chasers.
                    {summit.bonus && summit.bonus > 0 && (
                      <> Bonus points: <strong className="text-amber-400">{summit.bonus}</strong>.</>
                    )}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Difficulty: <span className={difficulty.color}>{difficulty.label}</span> (based on altitude and terrain)
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-display text-amber-400 mb-2">Activation Zone</h3>
                  <p>
                    To qualify for a valid activation, you must operate from within <strong>25 meters vertical distance</strong> of the summit.
                    The app will automatically detect if you&apos;re in the activation zone when using GPS.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-display text-amber-400 mb-2">Activity Statistics</h3>
                  <p>
                    This summit has been activated <strong className="text-cyan-400">{summit.activations ?? 0} times</strong> by ham radio operators.
                    {summit.activations === 0 && <> This is an <strong className="text-green-400">unactivated summit</strong> - be the first!</>}
                    {(summit.activations ?? 0) > 100 && <> This is a <strong className="text-amber-400">popular summit</strong> with frequent activations.</>}
                  </p>
                </section>
              </div>
            </div>

            {/* Nearby SOTA Summits */}
            {nearbySummits.length > 0 && (
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
                      {nearbySummits.map((s) => (
                        <tr key={s.ref} className="border-b border-gray-700/50 hover:bg-teal-500/5">
                          <td className="py-3 px-2">
                            <Link
                              to={`/summit/${s.ref.toLowerCase().replace(/\//g, '-')}`}
                              className="font-mono-data text-amber-400 hover:text-amber-300"
                            >
                              {s.ref}
                            </Link>
                          </td>
                          <td className="py-3 px-2 text-gray-200">{s.name}</td>
                          <td className="py-3 px-2 text-right font-mono-data text-green-400">
                            {(s.distance / 1000).toFixed(1)} km
                          </td>
                          <td className="py-3 px-2 text-right font-mono-data text-gray-300">
                            {s.altitude}m
                          </td>
                          <td className="py-3 px-2 text-right font-mono-data text-amber-400">
                            {s.points}pt
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Offline Access Note */}
            <div className="card-technical rounded p-6 animate-fade-in border-l-4 border-l-green-500">
              <h2 className="text-xl font-display text-green-400 mb-3">📱 Offline Access Available</h2>
              <p className="text-gray-300">
                This summit information is cached in your browser for offline access. Install this app as a PWA
                to access all {summit.association} SOTA summits even without internet connection during field operations.
              </p>
            </div>

            {/* External Resources */}
            <div className="card-technical rounded p-4 animate-fade-in">
              <h3 className="text-sm font-mono-data text-teal-400/60 mb-3 tracking-wider">EXTERNAL RESOURCES</h3>

              <div className="space-y-2">
                <a
                  href={`https://www.google.com/maps?q=${summit.lat},${summit.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 rounded bg-black/20 border border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all text-xs"
                >
                  <ExternalLink className="w-4 h-4 text-teal-400/60 mr-2" />
                  <div>
                    <div className="font-mono-data text-gray-300">Google Maps</div>
                    <div className="text-[10px] text-gray-500">Navigation and satellite imagery</div>
                  </div>
                </a>

                <a
                  href={`https://www.openstreetmap.org/?mlat=${summit.lat}&mlon=${summit.lon}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 rounded bg-black/20 border border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all text-xs"
                >
                  <ExternalLink className="w-4 h-4 text-teal-400/60 mr-2" />
                  <div>
                    <div className="font-mono-data text-gray-300">OpenStreetMap</div>
                    <div className="text-[10px] text-gray-500">Open source trail and terrain maps</div>
                  </div>
                </a>

                <a
                  href={`https://www.sotamaps.org/index.php?smt=${summit.ref}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 rounded bg-black/20 border border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all text-xs"
                >
                  <ExternalLink className="w-4 h-4 text-teal-400/60 mr-2" />
                  <div>
                    <div className="font-mono-data text-gray-300">SOTAmaps</div>
                    <div className="text-[10px] text-gray-500">Official SOTA activation history</div>
                  </div>
                </a>
              </div>
            </div>
          </main>

          <Footer isOnline={isOnline} sotaCount={sotaCount} sotaBuildDate={sotaBuildDate} />
        </div>
      </div>
    </>
  )
}
