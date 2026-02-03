import { RefreshCw, MapPin, Github, Languages, HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLocationData } from './hooks/useLocationData'
import { useGeolocation } from './hooks/useGeolocation'
import { cn } from './lib/utils'
import { useState, useEffect } from 'react' // Import useState and useEffect

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
        // Fetch JCC/JCG data
        const locationResponse = await fetch('/offline-qth/data/location-data.json')
        const locationJson = await locationResponse.json()
        setJccJcgCount(locationJson.locations.length)
        setLocationDataLastUpdate(locationJson.lastUpdate)

        // Fetch SOTA data
        const sotaResponse = await fetch('/offline-qth/data/sota-data.json')
        const sotaJson = await sotaResponse.json()
        setSotaCount(sotaJson.summits.length)
        setSotaDataLastUpdate(sotaJson.lastUpdate)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }

    fetchData()
  }, []) // Empty dependency array means this effect runs once on mount

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ja' ? 'en' : 'ja'
    i18n.changeLanguage(newLang)
  }

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-10">
      <div className="mx-auto max-w-4xl">
        <header className="text-center text-white mb-10 relative animate-fade-in">
          <Link
            to="/help"
            className="absolute right-24 top-0 px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all duration-300 text-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t('button.help')}</span>
          </Link>
          <button
            onClick={toggleLanguage}
            className="absolute right-0 top-0 px-4 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl flex items-center gap-2 transition-all duration-300 text-sm border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
            aria-label="Toggle language"
          >
            <Languages className="w-4 h-4" />
            {i18n.language === 'ja' ? 'EN' : 'JA'}
          </button>
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
              <MapPin className="w-10 h-10 md:w-12 md:h-12" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-xl md:text-2xl opacity-95 font-light">{t('app.subtitle')}</p>
        </header>

        <main className="space-y-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20 animate-fade-in">
            <div className="text-center text-white text-lg font-medium animate-pulse-slow">{t(status)}</div>
          </div>

          <button
            onClick={refetch}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl hover:shadow-orange-500/50 hover:scale-[1.02] animate-fade-in border border-white/20"
          >
            <RefreshCw className="w-6 h-6" />
            <span className="text-lg">{t('button.refetch')}</span>
          </button>

          {location && (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl space-y-1 animate-fade-in border border-white/30">
              <ResultItem label={t('label.latitude')} value={location.latitude} t={t} />
              <ResultItem label={t('label.longitude')} value={location.longitude} t={t} />
              {location.accuracy && <ResultItem label={t('label.accuracy')} value={`±${Math.round(location.accuracy)}m`} t={t} />}
              <ResultItem label={t('label.elevation')} value={location.elevation} t={t} />
              <ResultItem label={t('label.prefecture')} value={location.prefecture} t={t} />
              <ResultItem label={t('label.city')} value={location.city} t={t} />
              <ResultItem label={t('label.gridLocator')} value={location.gridLocator} highlight t={t} />
              <ResultItem label={t('label.jcc')} value={location.jcc} highlight t={t} />
              <ResultItem label={t('label.jcg')} value={location.jcg} highlight t={t} />
            </div>
          )}

          {location && location.sotaSummits && location.sotaSummits.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl animate-fade-in border border-green-300/50">
              <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <span>⛰️</span>
                {t('sota.nearby')} ({location.sotaSummits.length})
              </h2>

              {location.sotaSummits.map((summit) => {
                // 距離の表示形式を決定（1km未満はm、1km以上はkm）
                const distanceText = summit.distance < 1000
                  ? `${Math.round(summit.distance)}m`
                  : `${(summit.distance / 1000).toFixed(2)}km`

                return (
                  <div key={summit.ref} className="mb-6 last:mb-0 bg-white/70 rounded-xl p-4 space-y-1 relative">
                    {summit.isActivationZone && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                        {t('sota.activationZone')}
                      </div>
                    )}
                    <ResultItem label={t('sota.reference')} value={summit.ref} highlight t={t} />
                    <ResultItem
                      label={t('sota.name')}
                      value={i18n.language === 'ja' ? summit.name : summit.nameEn}
                      t={t}
                    />
                    <ResultItem label={t('sota.altitude')} value={`${summit.altitude}m`} t={t} />
                    <ResultItem label={t('sota.distance')} value={distanceText} highlight t={t} />
                    <ResultItem label={t('sota.points')} value={`${summit.points} pts`} t={t} />
                  </div>
                )
              })}
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 text-white animate-fade-in">
            <p className="font-bold mb-4 text-lg flex items-center gap-2">
              <span className="text-2xl">ℹ️</span>
              {t('info.title')}
            </p>
            <ul className="space-y-3 text-sm md:text-base leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-orange-400 mt-1">▸</span>
                <span>{t('info.autoFetch')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-400 mt-1">▸</span>
                <span>{t('info.permission')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-400 mt-1">▸</span>
                <span>{t('info.offline')}</span>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-white/20">
              <Link
                to="/help"
                className="inline-flex items-center gap-2 text-orange-300 hover:text-orange-200 transition-colors underline decoration-2"
              >
                <HelpCircle className="w-5 h-5" />
                <span>{t('info.moreHelp')}</span>
              </Link>
            </div>
          </div>
        </main>

        <footer className="mt-10 text-center text-white space-y-4 animate-fade-in">
          <p className="flex items-center justify-center gap-2">
            <span className={cn(
              "px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border shadow-lg",
              isOnline
                ? "bg-green-500/30 border-green-400/50 text-green-100"
                : "bg-orange-500/30 border-orange-400/50 text-orange-100"
            )}>
              {isOnline ? '🟢 ' + t('footer.online') : '🟠 ' + t('footer.offline')}
            </span>
          </p>
          <p className="text-sm opacity-90">
            <span className="font-mono bg-white/10 px-3 py-1 rounded-lg">v{__APP_VERSION__}</span>
            {' '} | {t('footer.createdBy')}{' '}
            <a
              href="https://x.com/je1wfv"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold hover:text-orange-300 transition-colors underline decoration-2 decoration-orange-400/50 hover:decoration-orange-400"
            >
              JE1WFV
            </a>
          </p>
          <p className="text-xs opacity-75 space-y-1">
            {locationDataLastUpdate && jccJcgCount && (
              <span>{t('footer.jccJcgData', { count: jccJcgCount, date: locationDataLastUpdate })}</span>
            )}
            <br />
            {sotaDataLastUpdate && sotaCount && (
              <span>{t('footer.sotaData', { count: sotaCount, date: sotaDataLastUpdate })}</span>
            )}
          </p>
          <p className="text-sm flex items-center justify-center gap-3">
            <Link
              to="/help"
              className="hover:text-orange-300 transition-colors flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300"
            >
              <HelpCircle className="w-4 h-4" />
              {t('button.help')}
            </Link>
            <a
              href="https://github.com/matsubo/offline-qth"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-300 transition-colors flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300"
            >
              <Github className="w-4 h-4" />
              {t('footer.github')}
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}

interface ResultItemProps {
  label: string
  value: string
  highlight?: boolean
  t: (key: string) => string
}

function ResultItem({ label, value, highlight, t }: ResultItemProps) {
  // 翻訳キーかどうかをチェック（ドットが含まれている場合は翻訳キーとみなす）
  const displayValue = value.includes('.') && !value.includes('°') ? t(value) : value

  return (
    <div className={cn(
      "flex justify-between items-center py-4 border-b border-gray-200/50 last:border-0 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 -mx-4 px-4 rounded-lg",
      highlight && "bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200/50 py-5"
    )}>
      <span className={cn(
        "font-semibold",
        highlight ? "text-gray-800 text-base" : "text-gray-700"
      )}>{label}</span>
      <span className={cn(
        "font-bold tabular-nums tracking-wide",
        highlight
          ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600 text-xl"
          : "text-blue-700 text-lg"
      )}>
        {displayValue}
      </span>
    </div>
  )
}

export default App
