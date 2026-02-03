import { RefreshCw, MapPin, Github, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocationData } from './hooks/useLocationData'
import { useGeolocation } from './hooks/useGeolocation'
import { cn } from './lib/utils'

function App() {
  const { t, i18n } = useTranslation()
  const locationData = useLocationData()
  const { status, location, isOnline, refetch } = useGeolocation(locationData)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ja' ? 'en' : 'ja'
    i18n.changeLanguage(newLang)
  }

  return (
    <div className="min-h-screen p-5 md:p-10">
      <div className="mx-auto max-w-2xl">
        <header className="text-center text-white mb-8 relative">
          <button
            onClick={toggleLanguage}
            className="absolute right-0 top-0 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors text-sm"
            aria-label="Toggle language"
          >
            <Languages className="w-4 h-4" />
            {i18n.language === 'ja' ? 'EN' : 'JA'}
          </button>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-2">
            <MapPin className="w-8 h-8" />
            {t('app.title')}
          </h1>
          <p className="text-lg md:text-xl opacity-90">{t('app.subtitle')}</p>
        </header>

        <main className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-center text-gray-700 text-lg mb-4">{t(status)}</div>
          </div>

          <button
            onClick={refetch}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            {t('button.refetch')}
          </button>

          {location && (
            <div className="bg-white rounded-xl p-6 shadow-lg space-y-4">
              <ResultItem label={t('label.latitude')} value={location.latitude} t={t} />
              <ResultItem label={t('label.longitude')} value={location.longitude} t={t} />
              <ResultItem label={t('label.elevation')} value={location.elevation} t={t} />
              <ResultItem label={t('label.prefecture')} value={location.prefecture} t={t} />
              <ResultItem label={t('label.city')} value={location.city} t={t} />
              <ResultItem label={t('label.gridLocator')} value={location.gridLocator} highlight t={t} />
              <ResultItem label={t('label.jcc')} value={location.jcc} highlight t={t} />
              <ResultItem label={t('label.jcg')} value={location.jcg} highlight t={t} />
            </div>
          )}

          <div className="bg-white/95 rounded-xl p-6 shadow-lg">
            <p className="font-bold mb-3">{t('info.title')}</p>
            <ul className="list-disc list-inside space-y-2 text-sm md:text-base">
              <li>{t('info.autoFetch')}</li>
              <li>{t('info.permission')}</li>
              <li>{t('info.offline')}</li>
            </ul>
          </div>
        </main>

        <footer className="mt-8 text-center text-white space-y-3">
          <p className="flex items-center justify-center gap-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-sm",
              isOnline ? "bg-green-500/30" : "bg-orange-500/30"
            )}>
              {isOnline ? t('footer.online') : t('footer.offline')}
            </span>
          </p>
          <p className="text-sm">
            v{__APP_VERSION__} | {t('footer.createdBy')}{' '}
            <a
              href="https://x.com/je1wfv"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold hover:underline"
            >
              JE1WFV
            </a>
          </p>
          <p className="text-sm flex items-center justify-center gap-3">
            <a
              href="https://github.com/matsubo/offline-qth"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
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
      "flex justify-between items-center py-3 border-b last:border-0",
      highlight && "bg-blue-50 -mx-6 px-6 py-4"
    )}>
      <span className="font-semibold text-gray-700">{label}:</span>
      <span className={cn(
        "font-medium",
        highlight ? "text-orange-600 text-lg" : "text-blue-600"
      )}>
        {displayValue}
      </span>
    </div>
  )
}

export default App
