import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import {
  MapPin,
  Flag as Mountain,
  Navigation,
  ArrowLeft,
  ExternalLink,
  Trophy as Award,
  Target,
  LocateFixed,
  Loader2
} from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { LocationMap } from '../components/LocationMap'
import { WeatherForecast } from '../components/WeatherForecast'
import { RecentActivations } from '../components/RecentActivations'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { sotaDatabase } from '../utils/sotaDatabase'
import type { SotaSummit, SotaSummitWithDistance } from '../types/location'
import { calculateGridLocator, haversineDistance } from '../utils/coordinate'
import { getAssociationFlag, getCountryName } from '../utils/countryFlags'
import { BookmarkButton } from '../components/BookmarkButton'
import { useBookmarks } from '../hooks/useBookmarks'

export function SummitPage() {
  const { ref } = useParams<{ ref: string }>()
  const { t, i18n } = useTranslation()
  const { getStatus, cycleBookmark } = useBookmarks()
  const [summit, setSummit] = useState<SotaSummit | null>(null)
  const [nearbySummits, setNearbySummits] = useState<SotaSummitWithDistance[]>([])
  const [gridLocator, setGridLocator] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [dlProgress, setDlProgress] = useState<{ loaded: number; total: number } | null>(null)
  const [sotaCount, setSotaCount] = useState<number | null>(null)
  const [sotaBuildDate, setSotaBuildDate] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // GPS activation zone checker
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'watching' | 'error'>('idle')
  const [gpsPos, setGpsPos] = useState<{
    lat: number
    lon: number
    altitude: number | null
    accuracy: number
    altitudeAccuracy: number | null
    updatedAt: number
  } | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const watchIdRef = useRef<number | null>(null)

  const startGpsWatch = useCallback(() => {
    if (!navigator.geolocation) { setGpsStatus('error'); return }
    setGpsStatus('watching')
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPos({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: Math.round(pos.coords.accuracy),
          altitudeAccuracy: pos.coords.altitudeAccuracy ? Math.round(pos.coords.altitudeAccuracy) : null,
          updatedAt: Date.now()
        })
        setSecondsAgo(0)
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, maximumAge: 0 }
    )
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  useEffect(() => {
    if (!gpsPos) return
    const interval = setInterval(() => setSecondsAgo(Math.floor((Date.now() - gpsPos.updatedAt) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [gpsPos])

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
    const unsub = sotaDatabase.onProgress((loaded, total) => {
      setDlProgress({ loaded, total })
    })
    return unsub
  }, [])

  useEffect(() => {
    async function loadSummitData() {
      try {
        if (!ref) {
          setLoading(false)
          return
        }

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
      <div className="min-h-screen p-3 sm:p-4 md:p-5 relative z-10">
        <div className="mx-auto max-w-6xl">
          <Header isOnline={isOnline} />
          <div className="card-technical rounded-none border-l-4 border-l-teal-500 p-12 flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-10 h-10 border-2 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
            <div className="font-mono-data text-teal-400 tracking-wider">{t('summitPage.loading')}</div>
            {dlProgress && dlProgress.total > 0 ? (
              <div className="w-64 space-y-1">
                <div className="flex justify-between text-[10px] font-mono-data text-teal-400/50">
                  <span>{(dlProgress.loaded / 1024 / 1024).toFixed(1)} MB</span>
                  <span>{Math.round(dlProgress.loaded / dlProgress.total * 100)}%</span>
                  <span>{(dlProgress.total / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-green-400 transition-all duration-150"
                    style={{ width: `${(dlProgress.loaded / dlProgress.total * 100).toFixed(1)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono-data text-teal-400/40">
                Downloading summit database on first visit (~52MB)
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!summit) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="card-technical rounded p-8 text-center">
            <h1 className="text-2xl font-display glow-amber mb-4">{t('summitPage.notFound')}</h1>
            <p className="text-gray-400 mb-6">{t('summitPage.notFoundDesc', { ref: ref?.toUpperCase().replace(/-/g, '/') })}</p>
            <Link to="/" className="btn-primary inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.backToHome')}
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
    if (points >= 10) return { label: t('summitPage.difficulty.extreme'), color: 'text-red-400' }
    if (points >= 8) return { label: t('summitPage.difficulty.veryHard'), color: 'text-orange-400' }
    if (points >= 4) return { label: t('summitPage.difficulty.moderate'), color: 'text-cyan-400' }
    return { label: t('summitPage.difficulty.easy'), color: 'text-amber-400' }
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
        <link rel="canonical" href={`https://matsubo.github.io/sota-peak-finder/summit/${summit.ref.toLowerCase().replace(/\//g, '-')}`} />

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
              <div className="text-xs font-mono-data glow-teal mb-2 tracking-wider flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm">{getAssociationFlag(summit.association || '')}</span>
                  <span className="flex items-center gap-1">
                    SOTA_SUMMIT //
                    <Link
                      to={`/summits?association=${encodeURIComponent(summit.association || '')}`}
                      className="hover:text-amber-400 transition-colors underline decoration-dotted"
                      title={`View all summits in ${summit.association}`}
                    >
                      {summit.association}
                    </Link>
                    /
                    <Link
                      to={`/summits?association=${encodeURIComponent(summit.association || '')}&region=${encodeURIComponent(summit.region || '')}`}
                      className="hover:text-green-400 transition-colors underline decoration-dotted"
                      title={`View all summits in ${summit.region}`}
                    >
                      {summit.region}
                    </Link>
                  </span>
                </span>
                <span className={`${difficulty.color} font-bold`}>{difficulty.label}</span>
              </div>
              <h1
                className="text-2xl sm:text-3xl md:text-5xl font-display glow-amber mb-2 cursor-pointer hover:text-amber-300 transition-colors break-all"
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
              <div className="mt-4 flex items-center gap-2">
                <BookmarkButton
                  status={getStatus(summit.ref)}
                  onCycle={() => cycleBookmark(summit.ref)}
                />
                <span className="text-xs font-mono-data text-teal-400/50">
                  {getStatus(summit.ref) === 'want_to_go' && t('bookmarks.wantToGo')}
                  {getStatus(summit.ref) === 'activated' && t('bookmarks.activated')}
                  {getStatus(summit.ref) === null && t('bookmarks.title')}
                </span>
              </div>
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(t('share.summitMessage', { name: summit.name, ref: summit.ref, altitude: summit.altitude, points: summit.points }))}&url=${encodeURIComponent(`https://matsubo.github.io/sota-peak-finder/summit/${summit.ref.toLowerCase().replace(/\//g, '-')}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded border border-teal-500/30 bg-black/30 hover:bg-teal-500/10 hover:border-teal-500/50 transition-all text-sm font-mono-data text-teal-300 tracking-wide"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {t('share.postOnX')}
              </a>
            </div>
          </div>

          <main className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <div className="card-technical rounded p-4">
                <div className="text-xs font-mono text-teal-400/60 mb-1">{t('summitPage.altitude')}</div>
                <div className="text-2xl font-mono-data glow-green">{summit.altitude}m</div>
              </div>

              <div className="card-technical rounded p-4">
                <div className="text-xs font-mono text-teal-400/60 mb-1">{t('summitPage.sotaPoints')}</div>
                <div className="text-2xl font-mono-data glow-amber">{summit.points} pt</div>
              </div>

              <div className="card-technical rounded p-4">
                <div className="text-xs font-mono text-teal-400/60 mb-1">{t('summitPage.activations')}</div>
                <div className="text-2xl font-mono-data text-cyan-400">{summit.activations}</div>
              </div>

              <div className="card-technical rounded p-4">
                <div className="text-xs font-mono text-teal-400/60 mb-1">{t('summitPage.grid')}</div>
                <div className="text-xl font-mono-data glow-green">{gridLocator}</div>
              </div>
            </div>

            {/* Coordinates Card */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {t('summitPage.gpsCoordinates')}
              </h2>

              <div className="space-y-3">
                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">{t('summitPage.decimalDegrees')}</div>
                  <div className="text-lg font-mono-data glow-green">
                    {summit.lat.toFixed(6)}°N, {summit.lon.toFixed(6)}°E
                  </div>
                </div>

                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">{t('summitPage.maidenheadLocator')}</div>
                  <div className="text-lg font-mono-data glow-green">{gridLocator}</div>
                </div>

                <div className="data-panel p-4 rounded">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">{t('summitPage.associationRegion')}</div>
                  <div className="text-lg font-sans-clean text-gray-200 flex items-center gap-2 flex-wrap">
                    <span className="text-2xl">{getAssociationFlag(summit.association || '')}</span>
                    <Link
                      to={`/summits?country=${encodeURIComponent(getCountryName(summit.association || ''))}`}
                      className="text-amber-400 hover:text-amber-300 transition-colors underline decoration-dotted"
                      title={`View all summits in ${getCountryName(summit.association || '')}`}
                    >
                      {getCountryName(summit.association || '')}
                    </Link>
                    <span className="text-teal-400/60">/</span>
                    <Link
                      to={`/summits?association=${encodeURIComponent(summit.association || '')}`}
                      className="text-green-400 hover:text-green-300 transition-colors underline decoration-dotted"
                      title={`View all summits in ${summit.association}`}
                    >
                      {summit.association}
                    </Link>
                    <span className="text-teal-400/60">/</span>
                    <Link
                      to={`/summits?association=${encodeURIComponent(summit.association || '')}&region=${encodeURIComponent(summit.region || '')}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors underline decoration-dotted"
                      title={`View all summits in ${summit.region}`}
                    >
                      {summit.region}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map with Activation Zone */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                <Navigation className="w-5 h-5 mr-2" />
                {t('summitPage.locationAndNearby')}
              </h2>
              <p className="text-sm text-gray-400 mb-4 font-mono-data">
                {t('summitPage.locationDesc')}
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
                      cardinalBearing: 'N' as const,
                      isActivationZone: true
                    },
                    // Nearby summits
                    ...nearbySummits
                  ] as never}
                />
              </div>
            </div>

            {/* Weather Forecast */}
            <WeatherForecast
              lat={summit.lat}
              lon={summit.lon}
              elevation={summit.altitude}
            />

            {/* Recent Activations */}
            <RecentActivations summitRef={summit.ref} />

            {/* Position Checker Card */}
            {(() => {
              const HALF_RANGE = 60
              const vertDist = gpsPos?.altitude != null
                ? Math.round(gpsPos.altitude - summit.altitude)
                : null
              const horizDist = gpsPos
                ? Math.round(haversineDistance(gpsPos.lat, gpsPos.lon, summit.lat, summit.lon))
                : null
              const inRange = vertDist !== null && Math.abs(vertDist) <= 25
              // Uncertain: altitude accuracy could push you across the zone boundary
              const uncertain = inRange && gpsPos?.altitudeAccuracy != null
                && (Math.abs(vertDist!) + gpsPos.altitudeAccuracy) > 25
              // Gauge: map deviation from summit (-HALF_RANGE..+HALF_RANGE) to 0..100%
              const gaugePos = vertDist !== null
                ? Math.max(2, Math.min(98, ((vertDist + HALF_RANGE) / (HALF_RANGE * 2)) * 100))
                : null
              const zoneL = ((-25 + HALF_RANGE) / (HALF_RANGE * 2)) * 100
              const zoneR = ((25 + HALF_RANGE) / (HALF_RANGE * 2)) * 100
              // Guidance when out of range
              const guidance = (!inRange && vertDist !== null)
                ? vertDist > 25
                  ? `↓ Descend ${vertDist - 25}m to enter activation zone`
                  : `↑ Ascend ${Math.abs(vertDist) - 25}m to enter activation zone`
                : null
              // Dynamic styling
              let borderClass = 'border-l-orange-500'
              let badgeBg = 'bg-black/20 border border-teal-500/10'
              let badgeTextClass = 'text-teal-400/30'
              let badgeLabel = '— AWAITING GPS —'
              if (gpsPos?.altitude != null) {
                if (uncertain) {
                  borderClass = 'border-l-amber-500'
                  badgeBg = 'bg-amber-500/10 border border-amber-500/30'
                  badgeTextClass = 'text-amber-400'
                  badgeLabel = '⚠ UNCERTAIN'
                } else if (inRange) {
                  borderClass = 'border-l-green-500'
                  badgeBg = 'bg-green-500/10 border border-green-500/30'
                  badgeTextClass = 'text-green-400'
                  badgeLabel = '✓ IN RANGE'
                } else {
                  borderClass = 'border-l-red-500'
                  badgeBg = 'bg-red-500/10 border border-red-500/30'
                  badgeTextClass = 'text-red-400'
                  badgeLabel = '✗ OUT OF RANGE'
                }
              }
              return (
                <div className={`card-technical rounded-none border-l-4 ${borderClass} p-5 animate-fade-in`}>

                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-orange-500/10 border border-orange-500/30">
                        <Target className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <h2 className="font-display text-base text-orange-400 tracking-wider leading-none">POSITION CHECKER</h2>
                        <p className="text-[10px] font-mono-data text-teal-400/40 mt-0.5">Activation zone: ±25m vertical from summit</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {gpsStatus === 'watching' && gpsPos && (
                        <span className="text-[10px] font-mono-data text-teal-400/40">
                          {secondsAgo === 0 ? '● live' : `${secondsAgo}s ago`}
                        </span>
                      )}
                      {gpsStatus === 'watching' && !gpsPos && (
                        <span className="flex items-center gap-1 text-[10px] font-mono-data text-teal-400/60">
                          <Loader2 className="w-3 h-3 animate-spin" />acquiring
                        </span>
                      )}
                      {gpsStatus === 'error' && (
                        <span className="text-[10px] font-mono-data text-red-400/70">GPS unavailable</span>
                      )}
                      {gpsStatus === 'idle' && (
                        <button
                          onClick={startGpsWatch}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 transition-all text-xs font-mono-data text-orange-400"
                        >
                          <LocateFixed className="w-3.5 h-3.5" />
                          Start Check
                        </button>
                      )}
                    </div>
                  </div>

                  {/* IDLE */}
                  {gpsStatus === 'idle' && (
                    <div className="text-center py-5 space-y-4">
                      <p className="text-sm font-mono-data text-gray-400 leading-relaxed">
                        Verify your vertical and horizontal distance<br />from the summit in real-time.
                      </p>
                      <button
                        onClick={startGpsWatch}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 transition-all text-sm font-mono-data text-orange-400"
                      >
                        <LocateFixed className="w-4 h-4" />
                        Start GPS Check
                      </button>
                    </div>
                  )}

                  {/* ACQUIRING */}
                  {gpsStatus === 'watching' && !gpsPos && (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                      <p className="font-mono-data text-teal-400 text-sm tracking-wider">Acquiring GPS signal...</p>
                      <p className="text-[11px] font-mono-data text-gray-500 text-center leading-relaxed">
                        Move to an open area if this<br />takes longer than expected
                      </p>
                    </div>
                  )}

                  {/* ACTIVE: no altitude from device */}
                  {gpsPos && gpsPos.altitude === null && (
                    <div className="space-y-3">
                      <div className="data-panel rounded p-3 border border-amber-500/20">
                        <p className="text-xs font-mono-data text-amber-400/80 leading-relaxed">
                          ⚠ Altitude unavailable — vertical range check not possible.
                          <span className="text-gray-500 block mt-1">Device may not support GPS altitude, or you are indoors.</span>
                        </p>
                      </div>
                      <div className="data-panel rounded p-3 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-mono-data text-teal-400/50 mb-0.5">↔ HORIZONTAL DISTANCE</div>
                          <div className="text-xl font-mono-data text-cyan-400">
                            {horizDist! >= 1000 ? `${(horizDist! / 1000).toFixed(2)}km` : `${horizDist}m`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-mono-data text-teal-400/50 mb-0.5">GPS ±</div>
                          <div className="text-sm font-mono-data text-gray-400">{gpsPos.accuracy}m</div>
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono-data text-teal-400/30">
                        {secondsAgo === 0 ? '● live' : `${secondsAgo}s ago`}
                      </div>
                    </div>
                  )}

                  {/* ACTIVE: has altitude */}
                  {gpsPos && gpsPos.altitude !== null && (
                    <div className="space-y-4">

                      {/* Primary status badge */}
                      <div className={`rounded p-4 text-center ${badgeBg}`}>
                        <div className={`text-2xl font-mono-data font-bold tracking-widest ${badgeTextClass}`}>
                          {badgeLabel}
                        </div>
                        {uncertain && (
                          <div className="text-[11px] font-mono-data text-amber-400/60 mt-1.5">
                            Altitude accuracy ±{gpsPos.altitudeAccuracy}m overlaps zone boundary — move closer to confirm
                          </div>
                        )}
                      </div>

                      {/* Deviation gauge */}
                      <div>
                        <div className="flex justify-between text-[9px] font-mono-data text-teal-400/30 mb-1 px-0.5">
                          <span>−{HALF_RANGE}m</span>
                          <span>★ SUMMIT</span>
                          <span>+{HALF_RANGE}m</span>
                        </div>
                        <div className="relative h-9 rounded bg-black/50 border border-teal-500/20 overflow-hidden">
                          {/* Activation zone band */}
                          <div
                            className="absolute inset-y-0 bg-green-500/15 border-x border-green-500/25"
                            style={{ left: `${zoneL}%`, width: `${zoneR - zoneL}%` }}
                          />
                          {/* −25 label */}
                          <div className="absolute inset-y-0 flex items-center" style={{ left: `${zoneL}%` }}>
                            <span className="text-[8px] font-mono-data text-green-500/50 pl-1">−25</span>
                          </div>
                          {/* +25 label */}
                          <div className="absolute inset-y-0 flex items-end pb-0.5 justify-end" style={{ right: `${100 - zoneR}%` }}>
                            <span className="text-[8px] font-mono-data text-green-500/50 pr-1">+25</span>
                          </div>
                          {/* Summit center line */}
                          <div className="absolute inset-y-0 w-px bg-amber-400/50" style={{ left: '50%' }} />
                          <div className="absolute inset-y-0 flex items-center" style={{ left: 'calc(50% + 3px)' }}>
                            <span className="text-[9px] text-amber-400/60">★</span>
                          </div>
                          {/* Your position dot */}
                          {gaugePos !== null && (
                            <div
                              className="absolute inset-y-0 flex items-center"
                              style={{ left: `${gaugePos}%`, transform: 'translateX(-50%)' }}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 shadow-lg ${
                                uncertain ? 'bg-amber-400 border-amber-200'
                                  : inRange ? 'bg-green-400 border-green-200'
                                    : 'bg-red-400 border-red-200'
                              }`} />
                            </div>
                          )}
                        </div>
                        <div className="text-center text-[9px] font-mono-data text-teal-400/25 mt-0.5">
                          ← below summit · above summit →
                        </div>
                      </div>

                      {/* Guidance hint when out of range */}
                      {guidance && (
                        <div className="data-panel rounded p-3 text-center border border-amber-500/20">
                          <span className="text-sm font-mono-data text-amber-400 tracking-wide">{guidance}</span>
                        </div>
                      )}

                      {/* Distance numbers */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="data-panel rounded p-3">
                          <div className="text-[10px] font-mono-data text-teal-400/50 mb-1">↕ VERTICAL</div>
                          <div className={`text-2xl font-mono-data leading-none ${Math.abs(vertDist!) <= 25 ? 'text-green-400' : 'text-red-400'}`}>
                            {vertDist! > 0 ? '+' : ''}{vertDist}m
                          </div>
                          <div className="text-[9px] font-mono-data text-gray-500 mt-1">
                            {vertDist! > 0 ? 'above summit' : vertDist! < 0 ? 'below summit' : 'at summit level'}
                          </div>
                        </div>
                        <div className="data-panel rounded p-3">
                          <div className="text-[10px] font-mono-data text-teal-400/50 mb-1">↔ HORIZONTAL</div>
                          <div className="text-2xl font-mono-data text-cyan-400 leading-none">
                            {horizDist! >= 1000 ? `${(horizDist! / 1000).toFixed(2)}km` : `${horizDist}m`}
                          </div>
                          <div className="text-[9px] font-mono-data text-gray-500 mt-1">from summit</div>
                        </div>
                      </div>

                      {/* GPS accuracy + freshness footer */}
                      <div className="flex items-center justify-between text-[10px] font-mono-data text-teal-400/35">
                        <span>
                          GPS ±{gpsPos.accuracy}m{gpsPos.altitudeAccuracy ? ` · Alt ±${gpsPos.altitudeAccuracy}m` : ''}
                        </span>
                        <span>{secondsAgo === 0 ? '● live' : `${secondsAgo}s ago`}</span>
                      </div>
                    </div>
                  )}

                </div>
              )
            })()}

            {/* Activation Information */}
            <div className="card-technical rounded p-6 animate-fade-in">
              <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                {t('summitPage.activationInfo')}
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
                  {t('summitPage.nearbySummits')}
                  <span className="ml-2 text-sm text-gray-400 font-mono-data">
                    {t('summitPage.within50km')}
                  </span>
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-teal-500/30">
                        <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">{t('table.ref')}</th>
                        <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">{t('table.name')}</th>
                        <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">{t('table.distance')}</th>
                        <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">{t('table.altitude')}</th>
                        <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">{t('table.points')}</th>
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

            {/* External Resources */}
            <div className="card-technical rounded p-4 animate-fade-in">
              <h3 className="text-sm font-mono-data text-teal-400/60 mb-3 tracking-wider">{t('summitPage.externalResources')}</h3>

              <div className="space-y-2">
                <a
                  href={`https://www.google.com/maps?q=${summit.lat},${summit.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 rounded bg-black/20 border border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all text-xs"
                >
                  <ExternalLink className="w-4 h-4 text-teal-400/60 mr-2" />
                  <div>
                    <div className="font-mono-data text-gray-300">{t('summitPage.viewOnGoogleMaps')}</div>
                    <div className="text-[10px] text-gray-500">{t('summitPage.googleMapsDesc')}</div>
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
                    <div className="font-mono-data text-gray-300">{t('summitPage.viewOnOSM')}</div>
                    <div className="text-[10px] text-gray-500">{t('summitPage.osmDesc')}</div>
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
                    <div className="font-mono-data text-gray-300">{t('summitPage.viewOnSOTAMaps')}</div>
                    <div className="text-[10px] text-gray-500">{t('summitPage.sotaMapsDesc')}</div>
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
