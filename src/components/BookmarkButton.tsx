import { Bookmark, Star, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BookmarkStatus } from '../hooks/useBookmarks'

interface BookmarkButtonProps {
  status: BookmarkStatus | null
  onCycle: () => void
  size?: 'sm' | 'md'
}

export function BookmarkButton({ status, onCycle, size = 'md' }: BookmarkButtonProps) {
  const { t } = useTranslation()

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const buttonSize = size === 'sm' ? 'p-1' : 'p-1.5'

  const getIconAndLabel = () => {
    if (status === 'want_to_go') {
      return {
        icon: <Star className={`${iconSize} fill-current`} />,
        color: 'text-amber-400 border-amber-500/50 hover:border-amber-500',
        label: t('bookmarks.wantToGo'),
      }
    }
    if (status === 'activated') {
      return {
        icon: <Trophy className={`${iconSize} fill-current`} />,
        color: 'text-green-400 border-green-500/50 hover:border-green-500',
        label: t('bookmarks.activated'),
      }
    }
    return {
      icon: <Bookmark className={`${iconSize}`} />,
      color: 'text-teal-400/40 border-teal-500/20 hover:border-teal-500/50 hover:text-teal-400/70',
      label: t('bookmarks.title'),
    }
  }

  const { icon, color, label } = getIconAndLabel()

  return (
    <button
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        onCycle()
      }}
      title={label}
      aria-label={label}
      className={`${buttonSize} rounded border transition-all ${color}`}
    >
      {icon}
    </button>
  )
}
