/**
 * 404 Not Found Page
 * Custom error page with vintage radio aesthetic
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Flag as Mountain, Search, ArrowLeft } from 'lucide-react'

export function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center relative z-10">
      <div className="mx-auto max-w-2xl w-full">
        {/* Error Card */}
        <div className="card-technical rounded border-l-4 border-l-red-500 p-8 animate-fade-in">
          {/* Error Code */}
          <div className="text-center mb-8">
            <div className="freq-display inline-block px-6 py-2 mb-4">
              <span className="text-red-400 text-6xl font-mono-data tracking-wider">404</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display text-red-400 glow-red mb-2">
              {t('notFound.title', 'SIGNAL NOT FOUND')}
            </h1>
            <p className="text-gray-400 font-mono-data text-sm tracking-wider">
              {t('notFound.subtitle', 'The frequency you requested does not exist')}
            </p>
          </div>

          {/* Error Details */}
          <div className="data-panel p-4 rounded mb-6">
            <div className="text-xs font-mono-data text-teal-400/60 mb-2">ERROR DETAILS</div>
            <div className="space-y-1 text-sm font-mono-data text-gray-300">
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span className="text-red-400">404 NOT FOUND</span>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>{' '}
                <span className="text-amber-400">{window.location.pathname}</span>
              </div>
              <div>
                <span className="text-gray-500">Suggestion:</span>{' '}
                <span className="text-teal-400">Return to base frequency</span>
              </div>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 transition-all group"
            >
              <Home className="w-5 h-5 text-teal-400 group-hover:text-teal-300" />
              <span className="font-mono-data text-teal-400 group-hover:text-teal-300">
                {t('notFound.goHome', 'Return to Summit Finder')}
              </span>
            </Link>

            <Link
              to="/summits"
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 transition-all group"
            >
              <Mountain className="w-5 h-5 text-amber-400 group-hover:text-amber-300" />
              <span className="font-mono-data text-amber-400 group-hover:text-amber-300">
                {t('notFound.browseSummits', 'Browse All Summits')}
              </span>
            </Link>

            <Link
              to="/help"
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded border border-gray-500/40 bg-gray-500/10 hover:bg-gray-500/20 transition-all group"
            >
              <Search className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
              <span className="font-mono-data text-gray-400 group-hover:text-gray-300">
                {t('notFound.help', 'Get Help')}
              </span>
            </Link>
          </div>

          {/* Technical Info */}
          <div className="mt-8 pt-6 border-t border-teal-500/10">
            <div className="text-center">
              <div className="text-[10px] font-mono-data text-teal-500/50 tracking-wider mb-2">
                SYSTEM STATUS
              </div>
              <div className="text-xs text-gray-500 font-mono-data space-y-1">
                <div>Database: <span className="text-green-400">ONLINE</span></div>
                <div>Service Worker: <span className="text-green-400">ACTIVE</span></div>
                <div>Offline Mode: <span className="text-cyan-400">AVAILABLE</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-400 transition-colors font-mono-data text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('notFound.goBack', 'Go Back')}
          </button>
        </div>
      </div>
    </div>
  )
}
