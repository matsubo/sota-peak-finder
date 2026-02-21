import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bookmark, Star, Trophy, Trash2, ArrowLeft } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useBookmarks } from '../hooks/useBookmarks'

interface SummitEntryProps {
  summitRef: string
  savedAt: string
  onRemove: (ref: string) => void
  removeLabel: string
  savedAtLabel: string
}

function SummitEntry({ summitRef, savedAt, onRemove, removeLabel, savedAtLabel }: SummitEntryProps) {
  const summitUrl = `/summit/${summitRef.toLowerCase().replace(/\//g, '-')}`

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 data-panel rounded p-3 hover:bg-teal-500/5 transition-colors">
      <div className="flex-1 min-w-0">
        <Link
          to={summitUrl}
          className="font-mono-data text-amber-400 hover:text-amber-300 transition-colors text-sm"
        >
          {summitRef}
        </Link>
        <div className="text-[10px] text-teal-400/50 font-mono-data mt-0.5">
          {savedAtLabel}: {formatDate(savedAt)}
        </div>
      </div>
      <button
        onClick={() => onRemove(summitRef)}
        title={removeLabel}
        aria-label={removeLabel}
        className="p-1.5 rounded border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/50 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function BookmarksPage() {
  const { t } = useTranslation()
  const { bookmarks, removeBookmark } = useBookmarks()

  const wantToGo = Object.entries(bookmarks).filter(([, b]) => b.status === 'want_to_go')
  const activated = Object.entries(bookmarks).filter(([, b]) => b.status === 'activated')
  const isEmpty = wantToGo.length === 0 && activated.length === 0

  return (
    <>
      <Helmet>
        <title>{t('bookmarks.title')} | SOTA Peak Finder</title>
      </Helmet>

      <div className="min-h-screen p-3 sm:p-4 md:p-5 relative z-10">
        <div className="mx-auto max-w-6xl">
          <Header />

          <div className="mb-6 animate-fade-in">
            <div className="card-technical rounded-none border-l-4 border-l-amber-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
                    <Bookmark className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl text-amber-400 tracking-wider">
                      {t('bookmarks.title')}
                    </h1>
                    <p className="text-xs text-teal-300/70 font-mono-data mt-1">
                      {t('bookmarks.count', { count: wantToGo.length + activated.length })}
                    </p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-data text-teal-400 border border-teal-500/30 rounded hover:bg-teal-500/10 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t('common.backToHome')}
                </Link>
              </div>
            </div>
          </div>

          <main className="space-y-4 animate-fade-in">
            {isEmpty ? (
              <div className="card-technical rounded-none p-10 text-center">
                <Bookmark className="w-10 h-10 text-teal-400/30 mx-auto mb-3" />
                <p className="text-gray-400 font-mono-data">{t('bookmarks.empty')}</p>
                <p className="text-xs text-gray-500 font-mono-data mt-2">{t('bookmarks.emptyDesc')}</p>
              </div>
            ) : (
              <>
                {wantToGo.length > 0 && (
                  <div className="card-technical rounded-none border-l-4 border-l-amber-500 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-amber-400 fill-current" />
                      <h2 className="font-display text-amber-400 tracking-wider">
                        {t('bookmarks.wantToGo')}
                        <span className="ml-2 text-sm font-mono-data text-amber-400/60">
                          ({wantToGo.length})
                        </span>
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {wantToGo.map(([ref, b]) => (
                        <SummitEntry
                          key={ref}
                          summitRef={ref}
                          savedAt={b.savedAt}
                          onRemove={removeBookmark}
                          removeLabel={t('bookmarks.remove')}
                          savedAtLabel={t('bookmarks.savedAt')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activated.length > 0 && (
                  <div className="card-technical rounded-none border-l-4 border-l-green-500 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-4 h-4 text-green-400 fill-current" />
                      <h2 className="font-display text-green-400 tracking-wider">
                        {t('bookmarks.activated')}
                        <span className="ml-2 text-sm font-mono-data text-green-400/60">
                          ({activated.length})
                        </span>
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {activated.map(([ref, b]) => (
                        <SummitEntry
                          key={ref}
                          summitRef={ref}
                          savedAt={b.savedAt}
                          onRemove={removeBookmark}
                          removeLabel={t('bookmarks.remove')}
                          savedAtLabel={t('bookmarks.savedAt')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          <Footer />
        </div>
      </div>
    </>
  )
}
