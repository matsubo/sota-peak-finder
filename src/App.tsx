import { RefreshCw, Navigation, Mountain, MapPin, ExternalLink, Database } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLocationData } from './hooks/useLocationData'
import { useGeolocation } from './hooks/useGeolocation'
import { cn } from './lib/utils'
import { useState, useEffect } from 'react'
import { trackSotaSummitView } from './utils/analytics'
import { LocationMap } from './components/LocationMap'
import { Header } from './components/Header'
import { Footer } from './components/Footer'

function App() {
  const { t, i18n } = useTranslation()
  const locationData = useLocationData()
  const { status, location, isOnline, refetch } = useGeolocation(locationData)

  const [sotaCount, setSotaCount] = useState<number | null>(null)
  const [sotaBuildDate, setSotaBuildDate] = useState<string | null>(null)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [overrideSummits, setOverrideSummits] = useState<typeof location.sotaSummits | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {

        // Import sotaDatabase dynamically to avoid circular dependencies
        const { sotaDatabase } = await import('./utils/sotaDatabase')
        await sotaDatabase.init()
        const stats = await sotaDatabase.getStats()
        const metadata = await sotaDatabase.getMetadata()
        setSotaCount(stats.totalSummits)

        // Format SOTA build date
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
        console.error("Failed to fetch data:", error)
      }
    }
    fetchData()
  }, [i18n.language])

  // Track SOTA summit view
  useEffect(() => {
    if (location && location.sotaSummits && location.sotaSummits.length > 0) {
      const nearestSummit = location.sotaSummits[0]
      trackSotaSummitView(
        location.sotaSummits.length,
        nearestSummit.ref,
        nearestSummit.distance
      )
    }
  }, [location])

  // Handle map click to find summits at clicked location
  const handleMapClick = async (lat: number, lon: number) => {
    if (!location) return

    setClickedLocation({ lat, lon })

    // Fetch summits near clicked location
    // Use very large radius (5000km) to always find 20 nearest summits regardless of distance
    const { findNearbySotaSummits } = await import('./utils/api')
    const summits = await findNearbySotaSummits(lat, lon, null, 20, 5000)

    // Override summits with clicked location results
    setOverrideSummits(summits)
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-5 relative z-10">
      <div className="mx-auto max-w-6xl">
        <Header isOnline={isOnline} />

        <main className="space-y-4">
          {/* Status display */}
          <div className="radio-panel rounded-sm p-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-teal-400 status-indicator"></div>
                <div className="font-mono-data text-xs tracking-widest text-teal-300">{t(status)}</div>
              </div>
              <div className="freq-display text-[10px] py-1">
                {new Date().toISOString().slice(0,10)} UTC
              </div>
            </div>
          </div>

          {/* Tuning button */}
          <button
            onClick={refetch}
            className="w-full radio-btn font-radio-dial text-base py-4 px-8 rounded-sm flex items-center justify-center gap-3 animate-fade-in"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="tracking-widest">{t('button.refetch')}</span>
          </button>

          {/* Summit Database Feature Card */}
          <Link
            to="/summits"
            className="block animate-fade-in group"
          >
            <div className="card-technical rounded-none p-4 border-l-4 border-l-amber-500 hover:bg-amber-500/5 transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
                    <Database className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-amber-400 tracking-wider mb-1">
                      {t('summits.title')}
                    </h3>
                    <p className="text-xs text-teal-300/70 font-mono-data">
                      {sotaCount ? `${sotaCount.toLocaleString()} ${t('summits.subtitle')}` : t('summits.subtitle')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-400/60 group-hover:text-amber-400 transition-colors">
                  <span className="text-xs font-mono-data hidden sm:inline">{t('summits.browseAll')}</span>
                  <ExternalLink className="w-5 h-5" />
                </div>
              </div>
            </div>
          </Link>

          {location && (
            <div className="card-technical rounded-none animate-fade-in overflow-hidden corner-accent">
              {/* GPS Coordinates Section */}
              <div className="bg-black/20">
                <div className="px-5 py-3 border-l-4 border-l-green-500">
                  <div className="text-[10px] font-mono-data glow-green tracking-wider mb-2">[ GPS COORDINATES ]</div>
                  <div className="grid grid-cols-2 gap-4">
                    <ResultItem label={t('label.latitude')} value={location.latitude} />
                    <ResultItem label={t('label.longitude')} value={location.longitude} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    {location.accuracy && <ResultItem label={t('label.accuracy')} value={`±${Math.round(location.accuracy)}m`} />}
                    <ResultItem label={t('label.elevation')} value={t(location.elevation)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Section */}
          {location && (
            <div className="animate-fade-in space-y-3">
              <div className="card-technical rounded-none p-3 border-l-4 border-l-blue-500">
                <h2 className="font-display text-lg text-blue-400 flex items-center gap-2 tracking-wider">
                  <MapPin className="w-5 h-5" />
                  MAP VIEW
                </h2>
              </div>

              <LocationMap
                latitude={location.latRaw}
                longitude={location.lonRaw}
                sotaSummits={overrideSummits || location.sotaSummits}
                isOnline={isOnline}
                onMapClick={handleMapClick}
                clickedLocation={clickedLocation}
              />
            </div>
          )}

          {location && (overrideSummits || location.sotaSummits) && (overrideSummits || location.sotaSummits)!.length > 0 && (
            <div className="animate-fade-in space-y-3">
              <div className="card-technical rounded-none p-3 border-l-4 border-l-green-500">
                <h2 className="font-display text-lg glow-green flex items-center gap-2 tracking-wider">
                  <Mountain className="w-5 h-5" />
                  {t('sota.nearby')} ({(overrideSummits || location.sotaSummits)!.length})
                </h2>
              </div>

              <div className="card-technical rounded-none overflow-hidden border-l-4 border-l-teal-500">
                {/* Table Header */}
                <div className="grid grid-cols-10 gap-2 px-3 py-2 bg-black/40 border-b border-teal-500/20 text-[10px] font-mono-data text-teal-400/60 tracking-wider">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">REF / NAME</div>
                  <div className="col-span-2">DISTANCE</div>
                  <div className="col-span-2">BEARING</div>
                  <div className="col-span-2">ALT / PTS</div>
                </div>

                {/* Summit Rows */}
                {(overrideSummits || location.sotaSummits)!.map((summit, index) => (
                  <Link
                    key={summit.ref}
                    to={`/summit/${summit.ref.toLowerCase().replace(/\//g, '-')}`}
                    className={cn(
                      "grid grid-cols-10 gap-2 px-3 py-2.5 border-b border-teal-500/10 hover:bg-teal-500/5 transition-colors group cursor-pointer",
                      index % 2 === 0 ? "bg-black/20" : "bg-black/10"
                    )}
                  >
                    {/* Number */}
                    <div className="col-span-1 flex items-center">
                      <span className="font-mono-data text-teal-400 text-sm">{index + 1}</span>
                    </div>

                    {/* Reference & Name */}
                    <div className="col-span-3 flex flex-col justify-center">
                      <div className="font-mono-data text-amber-400 text-sm tracking-wide">
                        {summit.ref}
                      </div>
                      <div className="text-teal-100/80 text-xs truncate">
                        {summit.name}
                      </div>
                    </div>

                    {/* Distance */}
                    <div className="col-span-2 flex items-center">
                      <span className="font-mono-data text-amber-300 text-sm">
                        {summit.distance < 1000
                          ? `${Math.round(summit.distance)}m`
                          : `${(summit.distance / 1000).toFixed(1)}km`
                        }
                      </span>
                    </div>

                    {/* Bearing */}
                    <div className="col-span-2 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full border border-teal-500/40 flex items-center justify-center bg-black/40">
                        <Navigation className="w-3 h-3 text-teal-400" style={{ transform: `rotate(${summit.bearing}deg)` }} />
                      </div>
                      <span className="font-mono-data text-teal-300 text-xs">{summit.cardinalBearing}</span>
                    </div>

                    {/* Altitude & Points */}
                    <div className="col-span-2 flex flex-col justify-center text-xs">
                      <div className="text-teal-100/80">{summit.altitude}m</div>
                      <div className="text-teal-400/60">{summit.points} pts</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>

        <Footer isOnline={isOnline} sotaCount={sotaCount} sotaBuildDate={sotaBuildDate} />
      </div>
    </div>
  )
}

interface ResultItemProps {
  label: string
  value: string | null
  highlight?: boolean
}

function ResultItem({ label, value, highlight }: ResultItemProps) {
  const displayValue = value || '---'

  if (highlight) {
    return (
      <div className="data-panel rounded p-3 text-center relative">
        <div className="text-[9px] font-mono-data text-teal-400/60 tracking-wider mb-1.5">{label}</div>
        <div className="font-mono-data text-2xl glow-amber tracking-wider">
          {displayValue}
        </div>
        {/* Corner accent for highlighted items */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/40"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500/40"></div>
      </div>
    )
  }

  return (
    <div className="py-0.5">
      <div className="text-[10px] font-mono-data text-teal-500/60 tracking-wider mb-0.5">{label}</div>
      <div className="font-mono text-base text-teal-100 tracking-wide">
        {displayValue}
      </div>
    </div>
  )
}

export default App

