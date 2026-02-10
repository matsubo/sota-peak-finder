import {
  Flag as Mountain,
  TrendingUp,
  Database as DatabaseIcon,
  MapPin,
  Globe
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HeroMapBanner } from './components/HeroMapBanner'
import { StatsCard, SummitListCard } from './components/StatsCard'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { sotaDatabase, SotaSummit } from './utils/sotaDatabase'
import { getFlagEmoji, getCountryCode } from './utils/countryFlags'

function App() {
  const { t, i18n } = useTranslation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [sotaBuildDate, setSotaBuildDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Dashboard stats
  const [totalSummits, setTotalSummits] = useState<number | null>(null)
  const [highestSummit, setHighestSummit] = useState<SotaSummit | null>(null)
  const [mostActivated, setMostActivated] = useState<SotaSummit[]>([])
  const [unactivatedCount, setUnactivatedCount] = useState<number>(0)
  const [unactivatedSummits, setUnactivatedSummits] = useState<SotaSummit[]>([])
  const [countryStats, setCountryStats] = useState<Array<{ country: string; count: number }>>([])

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

  // Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await sotaDatabase.init()

        // Get metadata
        const metadata = await sotaDatabase.getMetadata()
        if (metadata.buildDate) {
          const date = new Date(metadata.buildDate)
          const formatted = new Intl.DateTimeFormat(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }).format(date)
          setSotaBuildDate(formatted)
        }

        // Get basic stats
        const stats = await sotaDatabase.getStats()
        setTotalSummits(stats.totalSummits)

        // Get dashboard stats
        const dashboardStats = await sotaDatabase.getDashboardStats()
        setHighestSummit(dashboardStats.highestSummit)
        setMostActivated(dashboardStats.mostActivated)
        setUnactivatedCount(dashboardStats.unactivatedCount)
        setUnactivatedSummits(dashboardStats.unactivatedSummits)
        setCountryStats(dashboardStats.countryStats)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [i18n.language])

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-5 relative z-10">
      <div className="mx-auto max-w-6xl">
        <Header isOnline={isOnline} />

        <main className="space-y-4">
          {/* Hero Map Banner */}
          <HeroMapBanner totalSummits={totalSummits} isOnline={isOnline} />

          {/* Dashboard Title */}
          <div className="card-technical rounded-none p-4 border-l-4 border-l-amber-500 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
                  <DatabaseIcon className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-amber-400 tracking-wider">
                    {t('dashboard.title')}
                  </h2>
                  <p className="text-xs text-teal-300/70 font-mono-data mt-1">
                    {t('dashboard.subtitle', { count: totalSummits || 0 })}
                  </p>
                </div>
              </div>
              <Link
                to="/summits"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-sm hover:bg-amber-500/20 transition-all text-amber-400 font-mono-data text-sm"
              >
                {t('dashboard.browseAll')}
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="card-technical rounded-none p-8 text-center">
              <div className="text-teal-400 font-mono-data">{t('dashboard.loadingStats')}</div>
            </div>
          ) : (
            <>
              {/* Key Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                <StatsCard
                  title={t('dashboard.totalSummits')}
                  value={totalSummits?.toLocaleString() || '0'}
                  subtitle={t('dashboard.worldwide')}
                  icon={Mountain}
                  color="teal"
                />

                <StatsCard
                  title={t('dashboard.highestPeak')}
                  value={highestSummit ? `${highestSummit.altitude}m` : '---'}
                  subtitle={highestSummit?.name || '...'}
                  icon={TrendingUp}
                  color="amber"
                  linkTo={highestSummit ? `/summit/${highestSummit.ref.toLowerCase().replace(/\//g, '-')}` : undefined}
                />

                <StatsCard
                  title={t('dashboard.unactivated')}
                  value={unactivatedCount.toLocaleString()}
                  subtitle={t('dashboard.unactivatedPercent', { percent: ((unactivatedCount / (totalSummits || 1)) * 100).toFixed(1) })}
                  icon={MapPin}
                  color="blue"
                  linkTo="/summits?unactivated=true"
                />

                <StatsCard
                  title={t('dashboard.countries')}
                  value={countryStats.length}
                  subtitle={t('dashboard.worldwideCoverage')}
                  icon={Globe}
                  color="green"
                  linkTo="/summits"
                />
              </div>

              {/* Summit Lists Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
                <SummitListCard
                  title={t('dashboard.mostActivated')}
                  icon={TrendingUp}
                  color="green"
                  summits={mostActivated.map(s => ({
                    ref: s.ref,
                    name: s.name,
                    value: s.activations.toLocaleString(),
                    valueLabel: t('dashboard.activations')
                  }))}
                />

                <SummitListCard
                  title={t('dashboard.highValueUnactivated')}
                  icon={MapPin}
                  color="blue"
                  summits={unactivatedSummits.map(s => ({
                    ref: s.ref,
                    name: s.name,
                    value: `${s.points}pt • ${s.altitude}m`,
                    valueLabel: t('dashboard.untouched')
                  }))}
                />
              </div>

              {/* Country Distribution */}
              <div className="card-technical rounded-none border-l-4 border-l-teal-500 p-4 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded bg-teal-500/10 border border-teal-500/30">
                    <Globe className="w-5 h-5 text-teal-400" />
                  </div>
                  <h3 className="font-display text-lg tracking-wider text-teal-300">
                    {t('dashboard.topCountries')}
                  </h3>
                </div>

                <div className="space-y-2">
                  {countryStats.slice(0, 10).map((stat, index) => {
                    const percentage = ((stat.count / (totalSummits || 1)) * 100).toFixed(1)
                    const countryCode = getCountryCode(stat.country)
                    const flagEmoji = getFlagEmoji(countryCode)
                    return (
                      <Link
                        key={stat.country}
                        to={`/summits?country=${encodeURIComponent(stat.country)}`}
                        className="block data-panel rounded p-3 hover:bg-teal-500/10 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xs font-mono-data text-teal-400/60 w-6">
                              #{index + 1}
                            </span>
                            <span className="text-lg" title={stat.country}>
                              {flagEmoji}
                            </span>
                            <span className="text-sm font-mono-data text-amber-400 group-hover:text-amber-300 transition-colors">
                              {stat.country}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-base font-mono-data text-green-400">
                                {stat.count.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-teal-400/60 font-mono-data">
                                {percentage}%
                              </div>
                            </div>
                            <div className="w-24 bg-black/40 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-teal-500 to-green-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* CTA Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                <Link
                  to="/summits"
                  className="card-technical rounded-none border-l-4 border-l-amber-500 p-6 hover:bg-amber-500/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg text-amber-400 mb-2 tracking-wider">
                        {t('dashboard.browseAllSummits')}
                      </h3>
                      <p className="text-xs text-teal-300/70 font-mono-data">
                        {t('dashboard.browseAllDesc')}
                      </p>
                    </div>
                    <DatabaseIcon className="w-8 h-8 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                  </div>
                </Link>

                <Link
                  to="/nearby"
                  className="card-technical rounded-none border-l-4 border-l-blue-500 p-6 hover:bg-blue-500/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg text-blue-400 mb-2 tracking-wider">
                        {t('dashboard.findNearby')}
                      </h3>
                      <p className="text-xs text-teal-300/70 font-mono-data">
                        {t('dashboard.findNearbyDesc')}
                      </p>
                    </div>
                    <MapPin className="w-8 h-8 text-blue-400/60 group-hover:text-blue-400 transition-colors" />
                  </div>
                </Link>
              </div>

              {/* Share on X */}
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(t('share.topMessage'))}&url=${encodeURIComponent('https://matsubo.github.io/sota-peak-finder/')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm border border-teal-500/30 bg-black/30 hover:bg-teal-500/10 hover:border-teal-500/50 transition-all text-sm font-mono-data text-teal-300 tracking-wide animate-fade-in"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {t('share.postOnX')}
              </a>
            </>
          )}
        </main>

        <Footer isOnline={isOnline} sotaCount={totalSummits} sotaBuildDate={sotaBuildDate} />
      </div>
    </div>
  )
}

export default App
