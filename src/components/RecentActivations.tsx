import { useTranslation } from 'react-i18next'
import { Radio, Loader } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useActivations } from '../hooks/useActivations'

interface RecentActivationsProps {
  summitRef: string
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function RecentActivations({ summitRef }: RecentActivationsProps) {
  const { t, i18n } = useTranslation()
  const { activations, loading, error, fetchedAt } = useActivations(summitRef)

  if (!navigator.onLine && activations.length === 0) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in border-l-4 border-l-teal-500/50">
        <div className="text-sm font-mono-data text-teal-400/60">
          {t('activations.unavailableOffline')}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Loader className="w-5 h-5 text-teal-400 animate-spin" />
          <span className="text-sm font-mono-data text-teal-400/60">
            {t('activations.loading')}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in border-l-4 border-l-orange-500/50">
        <div className="text-sm font-mono-data text-orange-400/80">
          {t('activations.error')}
        </div>
      </div>
    )
  }

  return (
    <div className="card-technical rounded p-6 animate-fade-in">
      <h2 className="text-xl font-display glow-teal mb-1 flex items-center">
        <Radio className="w-5 h-5 mr-2" />
        {t('activations.title')}
      </h2>
      <p className="text-xs font-mono-data text-teal-400/60 mb-4">
        {t('activations.poweredBy')}
        {fetchedAt && (
          <span className="ml-2">
            — {t('activations.fetchedAt', { time: new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }).format(fetchedAt) })}
          </span>
        )}
      </p>

      {activations.length === 0 ? (
        <div className="text-sm font-mono-data text-gray-500">
          {t('activations.noActivations')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-teal-500/30">
                <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">
                  {t('activations.date')}
                </th>
                <th className="text-left py-3 px-2 font-mono-data text-xs text-teal-400">
                  {t('activations.callsign')}
                </th>
                <th className="text-right py-3 px-2 font-mono-data text-xs text-teal-400">
                  {t('activations.qsos')}
                </th>
              </tr>
            </thead>
            <tbody>
              {activations.map((activation) => (
                <tr
                  key={activation.id}
                  className="border-b border-gray-700/50 hover:bg-teal-500/5"
                >
                  <td className="py-3 px-2 font-mono-data text-gray-300">
                    {formatDate(activation.activationDate, i18n.language)}
                  </td>
                  <td className="py-3 px-2">
                    <Link
                      to={`/activator/${activation.userId}`}
                      className="font-mono-data text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {activation.ownCallsign}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-right font-mono-data text-green-400">
                    {activation.qsos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
