import { RefreshCw, Github, Languages, HelpCircle, Navigation, Database, Mountain, Hash } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLocationData } from './hooks/useLocationData'
import { useGeolocation } from './hooks/useGeolocation'
import { cn } from './lib/utils'
import { useState, useEffect } from 'react'

function App() {
  const { t, i18n } = useTranslation()
  const locationData = useLocationData()
  const { status, location, isOnline, refetch } = useGeolocation(locationData)

  const [jccJcgCount, setJccJcgCount] = useState<number | null>(null)
  const [sotaCount, setSotaCount] = useState<number | null>(null)
  const [locationDataLastUpdate, setLocationDataLastUpdate] = useState<string | null>(null)
  const [sotaDataLastUpdate, setSotaDataLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationResponse = await fetch('/offline-qth/data/location-data.json')
        const locationJson = await locationResponse.json()
        setJccJcgCount(locationJson.locations.length)
        setLocationDataLastUpdate(locationJson.lastUpdate)

        const sotaResponse = await fetch('/offline-qth/data/sota-data.json')
        const sotaJson = await sotaResponse.json()
        setSotaCount(sotaJson.summits.length)
        setSotaDataLastUpdate(sotaJson.lastUpdate)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }
    fetchData()
  }, [])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ja' ? 'en' : 'ja'
    i18n.changeLanguage(newLang)
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 text-slate-200">
      <div className="mx-auto max-w-3xl">
        <header className="flex justify-between items-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tighter">
            Offline QTH
          </h1>
          <div className="flex items-center gap-2">
            <Link to="/help" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
              <HelpCircle className="w-5 h-5" />
            </Link>
            <button
              onClick={toggleLanguage}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              aria-label="Toggle language"
            >
              <Languages className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="space-y-8">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 shadow-2xl animate-fade-in">
            <div className="text-center text-slate-300 text-base font-medium animate-pulse-slow">{t(status)}</div>
          </div>

          <button
            onClick={refetch}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-500/50 border border-indigo-400/50 hover:scale-[1.02] animate-fade-in"
          >
            <RefreshCw className="w-6 h-6" />
            <span className="text-lg tracking-wide">{t('button.refetch')}</span>
          </button>

          {location && (
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 animate-fade-in overflow-hidden">
              <div className="p-6 space-y-2">
                <ResultItem label={t('label.latitude')} value={location.latitude} />
                <ResultItem label={t('label.longitude')} value={location.longitude} />
                {location.accuracy && <ResultItem label={t('label.accuracy')} value={`±${Math.round(location.accuracy)}m`} />}
                <ResultItem label={t('label.elevation')} value={t(location.elevation)} />
              </div>
              <div className="bg-slate-900/50 px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <ResultItem label={t('label.prefecture')} value={location.prefecture} />
                <ResultItem label={t('label.city')} value={location.city} />
              </div>
               <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <ResultItem label={t('label.gridLocator')} value={location.gridLocator} highlight />
                <ResultItem label={t('label.jcc')} value={location.jcc} highlight />
                <ResultItem label={t('label.jcg')} value={location.jcg} highlight />
              </div>
            </div>
          )}

          {location && location.sotaSummits && location.sotaSummits.length > 0 && (
            <div className="animate-fade-in space-y-4">
               <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2">
                <Mountain className="text-indigo-400" />
                {t('sota.nearby')}
              </h2>
              {location.sotaSummits.map((summit) => (
                <div key={summit.ref} className="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/80 relative overflow-hidden">
                  <div className={cn(
                    "absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full z-10",
                    summit.isActivationZone ? "bg-green-500 text-white animate-pulse" : "bg-red-500 text-white"
                  )}>
                    {t('sota.rangeQuestion')} {summit.isActivationZone ? t('sota.activationZone') : t('sota.outOfRange')}
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <ResultItem label={t('sota.reference')} value={summit.ref} highlight />
                      <ResultItem
                        label={t('sota.name')}
                        value={i18n.language === 'ja' ? summit.name : summit.nameEn}
                      />
                      <ResultItem label={t('sota.altitude')} value={`${summit.altitude}m`} />
                      <ResultItem label={t('sota.points')} value={`${summit.points} pts`} />
                    </div>
                    <div className="col-span-1 flex flex-col items-center justify-center space-y-2 bg-slate-900/50 rounded-lg p-2">
                      <div className="text-indigo-400 font-bold text-3xl">
                        {summit.distance < 1000
                          ? `${Math.round(summit.distance)}m`
                          : `${(summit.distance / 1000).toFixed(1)}km`
                        }
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Navigation className="w-4 h-4 text-indigo-400" style={{ transform: `rotate(${summit.bearing}deg)` }} />
                        <span className="font-semibold">{summit.cardinalBearing}</span>
                        <span className="text-xs text-slate-400">{Math.round(summit.bearing)}°</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-slate-400 text-sm space-y-4 animate-fade-in">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80">
            <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-left">
                  {jccJcgCount && <p className="font-semibold text-slate-300">{t('footer.jccJcgData', { count: jccJcgCount.toLocaleString() })}</p>}
                  {locationDataLastUpdate && <p className="text-slate-500">{t('footer.lastUpdated', { date: locationDataLastUpdate})}</p>}
                </div>
                <div className="text-left">
                  {sotaCount && <p className="font-semibold text-slate-300">{t('footer.sotaData', { count: sotaCount.toLocaleString() })}</p>}
                  {sotaDataLastUpdate && <p className="text-slate-500">{t('footer.lastUpdated', { date: sotaDataLastUpdate})}</p>}
                </div>
            </div>
          </div>
           <p className="flex items-center justify-center gap-2">
            <span className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium border",
              isOnline
                ? "bg-green-500/10 border-green-400/30 text-green-300"
                : "bg-orange-500/10 border-orange-400/30 text-orange-300"
            )}>
              {isOnline ? '● ' + t('footer.online') : '● ' + t('footer.offline')}
            </span>
          </p>
          <p>
            <span className="font-mono bg-slate-800/60 px-2 py-1 rounded text-xs">v{__APP_VERSION__}</span>
            {' '} | {t('footer.createdBy')}{' '}
            <a
              href="https://x.com/je1wfv"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              JE1WFV
            </a>
          </p>
          <a
            href="https://github.com/matsubo/offline-qth"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-indigo-300 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>{t('footer.github')}</span>
          </a>
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
  const displayValue = value || '...'

  return (
    <div className={cn(
      "py-1",
      highlight && "text-center"
    )}>
      <span className={cn(
        "text-sm font-medium",
        highlight ? "block text-indigo-400" : "text-slate-400"
      )}>{label}</span>
      <span className={cn(
        "font-semibold tracking-wide block",
        highlight
          ? "text-2xl text-white"
          : "text-lg text-white"
      )}>
        {displayValue}
      </span>
    </div>
  )
}

export default App

