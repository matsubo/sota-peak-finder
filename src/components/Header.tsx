import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Database, Map, Bookmark } from 'lucide-react'
import { cn } from '../lib/utils'
import { useBookmarks } from '../hooks/useBookmarks'

interface HeaderProps {
  isOnline?: boolean
}

export function Header({ isOnline = false }: HeaderProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { bookmarkCount } = useBookmarks()

  return (
    <header className="mb-4 animate-fade-in">
      {/* Compact control panel header */}
      <div className="radio-panel rounded-sm p-3 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title */}
          <div className="flex-1 min-w-0">
            <Link to="/" className="block hover:opacity-80 transition-opacity">
              <h1 className="text-2xl md:text-3xl font-radio-dial vfd-display leading-none">
                {t('app.title')}
              </h1>
              <h2 className="text-sm md:text-base font-display text-amber-400 tracking-wider" style={{textShadow: '0 0 8px rgba(255,185,40,0.4)'}}>
                {t('app.subtitle').split('—')[0]}
              </h2>
            </Link>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1.5">
            {/* Online/Offline Status */}
            <div className="hidden sm:flex items-center gap-2 px-2 py-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500 status-indicator" : "bg-orange-500"
              )}></div>
              <span className="font-mono-data text-xs tracking-wider text-teal-400/80">
                {isOnline ? t('footer.online') : t('footer.offline')}
              </span>
            </div>

            <Link
              to="/summits"
              className={`p-1.5 rounded border transition-all ${
                location.pathname === '/summits'
                  ? 'border-amber-500/60 bg-amber-500/20'
                  : 'border-teal-500/40 bg-black/40 hover:bg-amber-500/20'
              }`}
              title={t('header.browseAllSummits')}
            >
              <Database className={`w-3.5 h-3.5 ${location.pathname === '/summits' ? 'text-amber-400' : 'text-teal-400'}`} />
            </Link>
            <Link
              to="/nearby"
              className={`p-1.5 rounded border transition-all ${
                location.pathname === '/nearby'
                  ? 'border-blue-500/60 bg-blue-500/20'
                  : 'border-teal-500/40 bg-black/40 hover:bg-blue-500/20'
              }`}
              title={t('header.findNearestSummits')}
            >
              <Map className={`w-3.5 h-3.5 ${location.pathname === '/nearby' ? 'text-blue-400' : 'text-teal-400'}`} />
            </Link>
            <Link
              to="/bookmarks"
              className={`relative p-1.5 rounded border transition-all ${
                location.pathname === '/bookmarks'
                  ? 'border-amber-500/60 bg-amber-500/20'
                  : 'border-teal-500/40 bg-black/40 hover:bg-amber-500/20'
              }`}
              title={t('bookmarks.headerTitle')}
            >
              <Bookmark className={`w-3.5 h-3.5 ${location.pathname === '/bookmarks' ? 'text-amber-400' : 'text-teal-400'}`} />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-amber-500 text-black text-[8px] font-bold font-mono-data">
                  {bookmarkCount > 9 ? '9+' : bookmarkCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
