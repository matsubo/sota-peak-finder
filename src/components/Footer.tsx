import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Github, Languages, HelpCircle, Database, BookOpen, MessageCircle, ExternalLink } from 'lucide-react'
import { cn } from '../lib/utils'
import { trackLanguageChange } from '../utils/analytics'

interface FooterProps {
  isOnline?: boolean
  sotaCount?: number | null
  sotaBuildDate?: string | null
}

export function Footer({ isOnline = false, sotaCount = null, sotaBuildDate = null }: FooterProps) {
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const currentLang = i18n.language
    const newLang = currentLang === 'ja' ? 'en' : 'ja'
    i18n.changeLanguage(newLang)
    trackLanguageChange(currentLang, newLang)
  }

  return (
    <footer className="mt-12 animate-fade-in">
      <div className="card-technical rounded-none border-l-4 border-l-teal-500/40 p-5">
        <div className="space-y-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between border-b border-teal-500/10 pb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500 status-indicator" : "bg-orange-500"
              )}></div>
              <span className="font-mono-data text-xs tracking-wider text-teal-400/80">
                {isOnline ? t('footer.online') : t('footer.offline')}
              </span>
            </div>
            <div className="freq-display text-[9px] px-2 py-0.5">
              v{__APP_VERSION__}
            </div>
          </div>

          {/* Creator Info */}
          <div className="text-center">
            <div className="text-[10px] font-mono-data text-teal-500/60 tracking-wider mb-1">SYSTEM OPERATOR</div>
            <div className="text-sm font-mono">
              <span className="text-teal-400/60">{t('footer.createdBy')}</span>{' '}
              <a
                href="https://x.com/je1wfv"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold glow-amber hover:text-amber-400 transition-colors"
              >
                JE1WFV
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="border-t border-teal-500/10 pt-4 space-y-3">
            {/* Internal Navigation */}
            <div>
              <div className="text-[9px] font-mono-data text-teal-500/50 tracking-wider mb-2 text-center">
                NAVIGATION
              </div>
              <div className="flex items-center justify-center gap-4">
                <Link
                  to="/summits"
                  className="inline-flex items-center gap-1.5 text-amber-400/80 hover:text-amber-300 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  <span className="text-xs font-mono-data">{t('summits.browseAll')}</span>
                </Link>
                <div className="w-px h-4 bg-teal-500/20"></div>
                <Link
                  to="/help"
                  className="inline-flex items-center gap-1.5 text-amber-400/80 hover:text-amber-300 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-xs font-mono-data">{t('button.help')}</span>
                </Link>
              </div>
            </div>

            {/* External Resources */}
            <div>
              <div className="text-[9px] font-mono-data text-teal-500/50 tracking-wider mb-2 text-center">
                EXTERNAL RESOURCES
              </div>
              <div className="flex items-center justify-center gap-4">
                <a
                  href="https://je1wfv.teraren.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-500/60 hover:text-teal-400 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-mono-data">{t('footer.blog')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="w-px h-4 bg-teal-500/20"></div>
                <a
                  href="https://discord.gg/Fztt8jwr6A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-500/60 hover:text-teal-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-mono-data">{t('footer.discord')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="w-px h-4 bg-teal-500/20"></div>
                <a
                  href="https://github.com/matsubo/offline-qth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-500/60 hover:text-teal-400 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-xs font-mono-data">{t('footer.github')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Database Stats */}
          {(sotaCount || sotaBuildDate) && (
            <div className="text-center border-t border-teal-500/10 pt-3">
              <div className="text-[9px] font-mono-data text-teal-500/50 tracking-wider">
                {sotaCount && (
                  <span>SOTA DATABASE: {sotaCount.toLocaleString()} summits</span>
                )}
                {sotaBuildDate && (
                  <span> {'// '}Database Built: {sotaBuildDate}</span>
                )}
              </div>
            </div>
          )}

          {/* Language Toggle */}
          <div className="text-center border-t border-teal-500/10 pt-3">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-teal-500/40 bg-black/40 hover:bg-teal-500/20 transition-all"
              aria-label="Toggle language"
            >
              <Languages className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-mono-data text-teal-400">
                {i18n.language === 'ja' ? 'English' : '日本語'}
              </span>
            </button>
          </div>

          {/* 73 Sign-off */}
          <div className="text-center border-t border-teal-500/10 pt-3">
            <div className="font-display text-sm glow-green tracking-wider">73 DE JE1WFV</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
