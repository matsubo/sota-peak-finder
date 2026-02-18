import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Radio, Loader, ChevronLeft, ChevronRight } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useActivatorHistory } from '../hooks/useActivatorHistory'
import { sotaDatabase } from '../utils/sotaDatabase'

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function ActivatorPage() {
  const { userId } = useParams<{ userId: string }>()
  const { t, i18n } = useTranslation()
  const { activations, allActivations, callsign, loading, error, currentPage, totalPages, maxRecords, hasMore, setPage } = useActivatorHistory(userId)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [sotaCount, setSotaCount] = useState<number | null>(null)
  const [sotaBuildDate, setSotaBuildDate] = useState<string | null>(null)

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

  const totalQsos = allActivations.reduce((sum, a) => sum + a.QSOs, 0)
  const totalPoints = allActivations.reduce((sum, a) => sum + a.Total, 0)
  const pageTitle = callsign
    ? `${callsign} - SOTA Activator History | SOTA Peak Finder`
    : 'SOTA Activator History | SOTA Peak Finder'

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`SOTA activation history for ${callsign || 'activator'}`} />
      </Helmet>

      <div className="min-h-screen p-3 sm:p-4 md:p-5 relative z-10">
        <div className="mx-auto max-w-6xl">
          <Header isOnline={isOnline} />

          {/* Back navigation */}
          <div className="mb-6 animate-fade-in">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-sm font-mono-data text-teal-400 hover:text-teal-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.backToHome')}
            </button>
          </div>

          {loading && (
            <div className="card-technical rounded p-8 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-3">
                <Loader className="w-5 h-5 text-teal-400 animate-spin" />
                <span className="text-sm font-mono-data text-teal-400/60">
                  {t('activator.loading')}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="card-technical rounded p-8 text-center animate-fade-in">
              <div className="text-sm font-mono-data text-orange-400/80">
                {t('activator.error')}
              </div>
              <Link to="/" className="btn-primary inline-flex items-center mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.backToHome')}
              </Link>
            </div>
          )}

          {!loading && !error && (
            <main className="space-y-6">
              {/* Activator Header */}
              <div className="card-technical rounded-none border-l-4 border-l-amber-500 p-6 corner-accent animate-fade-in">
                <div className="text-xs font-mono-data glow-teal mb-2 tracking-wider">
                  ACTIVATOR // {t('activator.title')}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-display glow-amber mb-2">
                  {callsign || 'Unknown'}
                </h1>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 animate-fade-in">
                <div className="card-technical rounded p-4">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">{t('activator.totalActivations')}</div>
                  <div className="text-2xl font-mono-data text-cyan-400">{allActivations.length}</div>
                </div>

                <div className="card-technical rounded p-4">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">{t('activator.totalQsos')}</div>
                  <div className="text-2xl font-mono-data glow-green">{totalQsos}</div>
                </div>

                <div className="card-technical rounded p-4">
                  <div className="text-xs font-mono text-teal-400/60 mb-1">{t('activator.totalPoints')}</div>
                  <div className="text-2xl font-mono-data glow-amber">{totalPoints}</div>
                </div>
              </div>

              {/* Activation History Table */}
              <div className="card-technical rounded p-6 animate-fade-in">
                <h2 className="text-xl font-display glow-teal mb-4 flex items-center">
                  <Radio className="w-5 h-5 mr-2" />
                  {t('activations.title')}
                </h2>

                {allActivations.length === 0 ? (
                  <div className="text-sm font-mono-data text-gray-500">
                    {t('activator.noHistory')}
                  </div>
                ) : (
                  <>
                    {/* Showing info */}
                    <div className="text-xs font-mono-data text-gray-500 mb-3">
                      {t('activator.showing', {
                        start: (currentPage - 1) * 50 + 1,
                        end: Math.min(currentPage * 50, allActivations.length),
                        total: allActivations.length
                      })}
                      {hasMore && (
                        <span className="ml-2 text-orange-400/70">
                          {t('activator.limitNotice', { max: maxRecords })}
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-teal-500/30">
                            <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">
                              {t('activator.date')}
                            </th>
                            <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">
                              {t('activator.summit')}
                            </th>
                            <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">
                              {t('activator.qsos')}
                            </th>
                            <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">
                              {t('activator.points')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {activations.map((activation) => (
                            <tr
                              key={activation.ActivationId}
                              className="border-b border-gray-700/50 hover:bg-teal-500/5"
                            >
                              <td className="py-3 px-2 font-mono-data text-gray-300">
                                {formatDate(activation.ActivationDate, i18n.language)}
                              </td>
                              <td className="py-3 px-2">
                                <Link
                                  to={`/summit/${activation.SummitCode.toLowerCase().replace(/\//g, '-')}`}
                                  className="font-mono-data text-amber-400 hover:text-amber-300 transition-colors"
                                >
                                  {activation.SummitCode}
                                </Link>
                                <span className="ml-2 text-gray-500 text-xs">{activation.Summit}</span>
                              </td>
                              <td className="py-3 px-2 text-right font-mono-data text-green-400">
                                {activation.QSOs}
                              </td>
                              <td className="py-3 px-2 text-right font-mono-data text-amber-400">
                                {activation.Total}pt
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={() => { setPage(currentPage - 1); window.scrollTo(0, 0) }}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4 text-teal-400" />
                          <span className="text-sm text-gray-300 font-mono-data">{t('common.prev')}</span>
                        </button>

                        <div className="text-sm text-gray-400 font-mono-data">
                          {t('summits.page')} {currentPage} {t('summits.of')} {totalPages}
                        </div>

                        <button
                          onClick={() => { setPage(currentPage + 1); window.scrollTo(0, 0) }}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 bg-black/60 border border-teal-500/40 rounded hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <span className="text-sm text-gray-300 font-mono-data">{t('common.next')}</span>
                          <ChevronRight className="w-4 h-4 text-teal-400" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
          )}

          <Footer isOnline={isOnline} sotaCount={sotaCount} sotaBuildDate={sotaBuildDate} />
        </div>
      </div>
    </>
  )
}
