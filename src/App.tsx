import { RefreshCw, Github, Languages, HelpCircle, Navigation, Mountain, BookOpen, MessageCircle } from 'lucide-react'
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
        <header className="flex justify-between items-center mb-5 animate-fade-in">
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

        <main className="space-y-5">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 shadow-2xl animate-fade-in">
            <div className="text-center text-slate-300 text-sm font-medium animate-pulse-slow">{t(status)}</div>
          </div>

          <button
            onClick={refetch}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 border border-indigo-400/50 hover:scale-[1.01] animate-fade-in"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-base tracking-wide">{t('button.refetch')}</span>
          </button>

          {location && (
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 animate-fade-in overflow-hidden">
              <div className="px-5 py-4 space-y-1.5">
                <ResultItem label={t('label.latitude')} value={location.latitude} />
                <ResultItem label={t('label.longitude')} value={location.longitude} />
                {location.accuracy && <ResultItem label={t('label.accuracy')} value={`±${Math.round(location.accuracy)}m`} />}
                <ResultItem label={t('label.elevation')} value={t(location.elevation)} />
              </div>
              <div className="bg-slate-900/50 px-5 py-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
                <ResultItem label={t('label.prefecture')} value={location.prefecture} />
                <ResultItem label={t('label.city')} value={location.city} />
              </div>
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ResultItem label={t('label.gridLocator')} value={location.gridLocator} highlight />
                <ResultItem label={t('label.jcc')} value={location.jcc} highlight />
                <ResultItem label={t('label.jcg')} value={location.jcg} highlight />
              </div>
            </div>
          )}

          {location && location.sotaSummits && location.sotaSummits.length > 0 && (
            <div className="animate-fade-in space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 px-1">
                <Mountain className="w-5 h-5 text-indigo-400" />
                {t('sota.nearby')}
              </h2>
              {location.sotaSummits.map((summit) => (
                <div key={summit.ref} className="bg-slate-800/50 backdrop-blur-md rounded-xl shadow-xl border border-slate-700/80 relative overflow-hidden">
                  <div className={cn(
                    "absolute top-2.5 right-2.5 text-xs font-bold px-2.5 py-0.5 rounded-full z-10",
                    summit.isActivationZone ? "bg-green-500 text-white animate-pulse" : "bg-red-500 text-white"
                  )}>
                    {t('sota.rangeQuestion')} {summit.isActivationZone ? t('sota.activationZone') : t('sota.outOfRange')}
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <ResultItem label={t('sota.reference')} value={summit.ref} highlight />
                      <ResultItem
                        label={t('sota.name')}
                        value={i18n.language === 'ja' ? summit.name : summit.nameEn}
                      />
                      <ResultItem label={t('sota.altitude')} value={`${summit.altitude}m`} />
                      <ResultItem label={t('sota.points')} value={`${summit.points} pts`} />
                    </div>
                    <div className="col-span-1 flex flex-col items-center justify-center space-y-1.5 bg-slate-900/50 rounded-lg p-2">
                      <div className="text-indigo-400 font-bold text-2xl">
                        {summit.distance < 1000
                          ? `${Math.round(summit.distance)}m`
                          : `${(summit.distance / 1000).toFixed(1)}km`
                        }
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                        <Navigation className="w-3.5 h-3.5 text-indigo-400" style={{ transform: `rotate(${summit.bearing}deg)` }} />
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

        <footer className="mt-10 pt-5 border-t border-slate-700/30 animate-fade-in">
          <div className="text-center text-xs text-slate-500 space-y-2.5">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                isOnline
                  ? "text-green-400/80"
                  : "text-orange-400/80"
              )}>
                <span className="text-[8px]">●</span> {isOnline ? t('footer.online') : t('footer.offline')}
              </span>
              <span className="text-slate-700">·</span>
              <span className="font-mono text-slate-600">v{__APP_VERSION__}</span>
              <span className="text-slate-700">·</span>
              <span>
                {t('footer.createdBy')}{' '}
                <a
                  href="https://x.com/je1wfv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  JE1WFV
                </a>
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <a
                href="https://je1wfv.teraren.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('footer.blog')}</span>
              </a>
              <a
                href="https://discord.gg/Fztt8jwr6A"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{t('footer.discord')}</span>
              </a>
              <a
                href="https://github.com/matsubo/offline-qth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>{t('footer.github')}</span>
              </a>
            </div>

            <div className="text-slate-600 pb-4">
              {jccJcgCount && sotaCount && (
                <span>{t('footer.jccJcgData', { count: jccJcgCount })} / {t('footer.sotaData', { count: sotaCount })}</span>
              )}
              {(locationDataLastUpdate || sotaDataLastUpdate) && (
                <span> · {t('footer.lastUpdated', { date: locationDataLastUpdate || sotaDataLastUpdate })}</span>
              )}
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
  const displayValue = value || '...'

  return (
    <div className={cn(
      "py-0.5",
      highlight && "text-center"
    )}>
      <span className={cn(
        "text-xs font-medium",
        highlight ? "block text-indigo-400" : "text-slate-400"
      )}>{label}</span>
      <span className={cn(
        "font-semibold tracking-wide block",
        highlight
          ? "text-xl text-white"
          : "text-base text-white"
      )}>
        {displayValue}
      </span>
    </div>
  )
}

export default App

