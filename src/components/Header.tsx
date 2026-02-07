import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HelpCircle, Database } from 'lucide-react'

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

interface HeaderProps {
  isOnline?: boolean
  shareText?: string
  shareUrl?: string
}

export function Header({ isOnline = false, shareText, shareUrl }: HeaderProps) {
  const { t } = useTranslation()

  const handleShareToX = () => {
    const parts: string[] = []
    if (shareText) parts.push(`text=${encodeURIComponent(shareText)}`)
    if (shareUrl) parts.push(`url=${encodeURIComponent(shareUrl)}`)
    window.open(`https://x.com/intent/tweet?${parts.join('&')}`, '_blank', 'noopener,noreferrer')
  }

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

          {/* Center: Signal meter */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="signal-meter w-20">
              <div className="signal-bar"></div>
              <div className="signal-bar"></div>
              <div className="signal-bar"></div>
              <div className="signal-bar"></div>
              <div className="signal-bar"></div>
            </div>
            <div className="text-[8px] font-mono-data text-teal-400/70 tracking-widest whitespace-nowrap">
              179.5K
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1.5">
            <Link
              to="/summits"
              className="p-1.5 rounded border border-teal-500/40 bg-black/40 hover:bg-teal-500/20 transition-all"
              title={t('summits.title')}
            >
              <Database className="w-3.5 h-3.5 text-teal-400" />
            </Link>
            <Link
              to="/help"
              className="p-1.5 rounded border border-teal-500/40 bg-black/40 hover:bg-teal-500/20 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
            </Link>
            {shareText && (
              <button
                onClick={handleShareToX}
                className="p-1.5 rounded border border-teal-500/40 bg-black/40 hover:bg-teal-500/20 transition-all"
                title="Share on X"
              >
                <XIcon className="w-3.5 h-3.5 text-teal-400" />
              </button>
            )}
            {isOnline && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 status-indicator"></div>
                <span className="text-[8px] font-mono-data text-green-400 tracking-wider">RX</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
