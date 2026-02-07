import { RefreshCw, Github, Languages, HelpCircle, Navigation, Mountain, BookOpen, MessageCircle, MapPin, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLocationData } from './hooks/useLocationData'
import { useGeolocation } from './hooks/useGeolocation'
import { cn } from './lib/utils'
import { useState, useEffect } from 'react'
import { trackLanguageChange, trackSotaSummitView } from './utils/analytics'
import { LocationMap } from './components/LocationMap'

function App() {
  const { t, i18n } = useTranslation()
  const locationData = useLocationData()
  const { status, location, isOnline, refetch } = useGeolocation(locationData)

  const [jccJcgCount, setJccJcgCount] = useState<number | null>(null)
  const [sotaCount, setSotaCount] = useState<number | null>(null)
  const [locationDataLastUpdate, setLocationDataLastUpdate] = useState<string | null>(null)
  const [sotaDataLastUpdate, setSotaDataLastUpdate] = useState<string | null>(null)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [overrideSummits, setOverrideSummits] = useState<typeof location.sotaSummits | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationResponse = await fetch('/offline-qth/data/location-data.json')
        const locationJson = await locationResponse.json()
        setJccJcgCount(locationJson.locations.length)
        setLocationDataLastUpdate(locationJson.lastUpdate)

        // Import sotaDatabase dynamically to avoid circular dependencies
        const { sotaDatabase } = await import('./utils/sotaDatabase')
        await sotaDatabase.init()
        const stats = await sotaDatabase.getStats()
        setSotaCount(stats.totalSummits)
        setSotaDataLastUpdate(new Date().toISOString().split('T')[0])
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    fetchData()
  }, [])

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

  const toggleLanguage = () => {
    const currentLang = i18n.language
    const newLang = currentLang === 'ja' ? 'en' : 'ja'
    i18n.changeLanguage(newLang)

    // Track language change
    trackLanguageChange(currentLang, newLang)
  }

  // Handle map click to find summits at clicked location
  const handleMapClick = async (lat: number, lon: number) => {
    if (!location) return

    setClickedLocation({ lat, lon })

    // Fetch summits near clicked location
    const { findNearbySotaSummits } = await import('./utils/api')
    const summits = await findNearbySotaSummits(lat, lon, null, 10)

    // Override summits with clicked location results
    setOverrideSummits(summits)
  }

  return (
    <div className="min-h-screen p-3 sm:p-5 md:p-6 relative z-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 animate-fade-in">
          {/* Main control panel header */}
          <div className="radio-panel rounded-sm p-5 relative overflow-hidden">
            {/* TX indicator LED */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="tx-indicator"></div>
              <span className="text-[10px] font-mono-data text-teal-300 tracking-wider">ON AIR</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Frequency display style title */}
              <div className="flex items-center gap-3">
                <div className="freq-display text-[11px]">
                  OFFLINE_v{__APP_VERSION__}
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-teal-500/50 to-transparent"></div>
              </div>

              {/* Main title with VFD display effect */}
              <div>
                <h1 className="text-3xl md:text-5xl font-radio-dial vfd-display leading-tight">
                  OFFLINE SOTA
                </h1>
                <h2 className="text-xl md:text-2xl font-display text-amber-400 mt-1 tracking-wider" style={{textShadow: '0 0 10px rgba(255,185,40,0.5)'}}>
                  SUMMIT FINDER
                </h2>
              </div>

              {/* Signal strength meter */}
              <div className="flex items-center gap-3 mt-2">
                <div className="signal-meter w-32">
                  <div className="signal-bar"></div>
                  <div className="signal-bar"></div>
                  <div className="signal-bar"></div>
                  <div className="signal-bar"></div>
                  <div className="signal-bar"></div>
                </div>
                <div className="text-[9px] font-mono-data text-teal-400/70 tracking-widest">
                  SIGNAL: 179.5K PEAKS
                </div>
              </div>

              {/* Control buttons row */}
              <div className="flex items-center gap-2 mt-3">
                <Link
                  to="/help"
                  className="p-2 rounded border border-teal-500/40 bg-black/40 hover:bg-teal-500/20 hover:border-teal-500/60 transition-all"
                >
                  <HelpCircle className="w-4 h-4 text-teal-400" />
                </Link>
                <button
                  onClick={toggleLanguage}
                  className="p-2 rounded border border-teal-500/40 bg-black/40 hover:bg-teal-500/20 hover:border-teal-500/60 transition-all"
                  aria-label="Toggle language"
                >
                  <Languages className="w-4 h-4 text-teal-400" />
                </button>
                <div className="flex-1"></div>
                {isOnline && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                    <div className="w-2 h-2 rounded-full bg-green-400 status-indicator"></div>
                    <span className="text-[10px] font-mono-data text-green-400 tracking-wider">RX</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

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
            className="w-full radio-btn font-radio-dial text-base py-4 px-8 rounded-sm flex items-center justify-center gap-3 animate-fade-in relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <RefreshCw className="w-5 h-5 relative z-10" />
            <span className="tracking-widest relative z-10">{t('button.refetch')}</span>
          </button>

          {location && (
            <div className="card-technical rounded-none animate-fade-in overflow-hidden corner-accent">
              {/* GPS Coordinates Section */}
              <div className="border-b border-teal-500/20 bg-black/20">
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

              {/* Location Section */}
              <div className="px-5 py-3 border-l-4 border-l-teal-500 relative z-10">
                <div className="text-[10px] font-mono-data glow-teal tracking-wider mb-2">[ LOCATION DATA ]</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <ResultItem label={t('label.prefecture')} value={location.prefecture} />
                  <ResultItem label={t('label.city')} value={location.city} />
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
                  <div
                    key={summit.ref}
                    className={cn(
                      "grid grid-cols-10 gap-2 px-3 py-2.5 border-b border-teal-500/10 hover:bg-teal-500/5 transition-colors group cursor-pointer",
                      index % 2 === 0 ? "bg-black/20" : "bg-black/10"
                    )}
                    onClick={() => isOnline && window.open(`https://www.sotamaps.org/index.php?smt=${summit.ref}`, '_blank')}
                  >
                    {/* Number */}
                    <div className="col-span-1 flex items-center">
                      <span className="font-mono-data text-teal-400 text-sm">{index + 1}</span>
                    </div>

                    {/* Reference & Name */}
                    <div className="col-span-3 flex flex-col justify-center">
                      <div className="font-mono-data text-amber-400 text-sm tracking-wide flex items-center gap-1.5">
                        {summit.ref}
                        {isOnline && (
                          <ExternalLink className="w-3 h-3 text-teal-400/50 group-hover:text-teal-400 transition-colors" />
                        )}
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="mt-12 animate-fade-in">
          <div className="card-technical rounded-none border-l-4 border-l-teal-500/40 p-5">
            <div className="space-y-4">
              {/* Status Bar */}
              <div className="flex items-center justify-between border-b border-teal-500/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isOnline ? "bg-green-500 status-indicator" : "bg-orange-500"
                  )}></div>
                  <span className="font-mono-data text-xs tracking-wider text-teal-400/80">
                    {isOnline ? t('footer.online') : t('footer.offline')}
                  </span>
                </div>
                <div className="font-mono-data text-[10px] text-teal-500/60 tracking-wider">
                  SYS_v{__APP_VERSION__}
                </div>
              </div>

              {/* Creator Info */}
              <div className="text-center">
                <div className="text-[10px] font-mono-data text-teal-500/60 tracking-wider mb-1">SYSTEM OPERATOR</div>
                <div className="text-sm font-mono">
                  <span className="text-teal-400/60">{t('footer.createdBy')}</span>{' '}
                  <a
                    href="https://x.com/je1wfv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold glow-amber hover:text-amber-400 transition-colors"
                  >
                    JE1WFV
                  </a>
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center justify-center gap-5 border-t border-teal-500/10 pt-3">
                <a
                  href="https://je1wfv.teraren.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-500/60 hover:text-teal-400 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-mono-data">{t('footer.blog')}</span>
                </a>
                <div className="w-px h-4 bg-teal-500/20"></div>
                <a
                  href="https://discord.gg/Fztt8jwr6A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-500/60 hover:text-teal-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-mono-data">{t('footer.discord')}</span>
                </a>
                <div className="w-px h-4 bg-teal-500/20"></div>
                <a
                  href="https://github.com/matsubo/offline-qth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-500/60 hover:text-teal-400 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-xs font-mono-data">{t('footer.github')}</span>
                </a>
              </div>

              {/* Database Stats */}
              <div className="text-center border-t border-teal-500/10 pt-3">
                <div className="text-[9px] font-mono-data text-teal-500/50 tracking-wider">
                  {jccJcgCount && sotaCount && (
                    <span>DATABASE: {t('footer.jccJcgData', { count: jccJcgCount })} / {t('footer.sotaData', { count: sotaCount })}</span>
                  )}
                  {(locationDataLastUpdate || sotaDataLastUpdate) && (
                    <span> {'// '}{t('footer.lastUpdated', { date: locationDataLastUpdate || sotaDataLastUpdate })}</span>
                  )}
                </div>
              </div>

              {/* 73 Sign-off */}
              <div className="text-center border-t border-teal-500/10 pt-3">
                <div className="font-display text-sm glow-green tracking-wider">73 DE JE1WFV</div>
              </div>
            </div>
          </div>
        </footer>
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

