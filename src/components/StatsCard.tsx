import { Link } from 'react-router-dom'
import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = React.ComponentType<any>

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: IconComponent
  trend?: {
    value: string
    positive?: boolean
  }
  linkTo?: string
  color?: 'amber' | 'teal' | 'green' | 'blue' | 'red'
  className?: string
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  linkTo,
  color = 'teal',
  className = ''
}: StatsCardProps) {
  const colorClasses = {
    amber: 'border-l-amber-500 bg-amber-500/5',
    teal: 'border-l-teal-500 bg-teal-500/5',
    green: 'border-l-green-500 bg-green-500/5',
    blue: 'border-l-blue-500 bg-blue-500/5',
    red: 'border-l-red-500 bg-red-500/5'
  }

  const iconColorClasses = {
    amber: 'text-amber-400 bg-amber-500/10',
    teal: 'text-teal-400 bg-teal-500/10',
    green: 'text-green-400 bg-green-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    red: 'text-red-400 bg-red-500/10'
  }

  const textColorClasses = {
    amber: 'glow-amber',
    teal: 'glow-teal',
    green: 'glow-green',
    blue: 'glow-blue',
    red: 'text-red-400'
  }

  const content = (
    <div className={`card-technical rounded-none border-l-4 p-4 transition-all hover:bg-opacity-80 ${colorClasses[color]} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono-data text-teal-400/60 tracking-wider mb-2 uppercase">
            {title}
          </div>
          <div className={`text-3xl font-mono-data ${textColorClasses[color]} mb-1 tracking-tight`}>
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-teal-200/70 font-mono-data">
              {subtitle}
            </div>
          )}
          {trend && (
            <div className={`text-xs font-mono-data mt-2 ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.positive ? '↗' : '↘'} {trend.value}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded border border-opacity-30 ${iconColorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="block group">
        {content}
      </Link>
    )
  }

  return content
}

interface SummitListCardProps {
  title: string
  summits: Array<{
    ref: string
    name: string
    value: string | number
    valueLabel: string
  }>
  icon?: IconComponent
  color?: 'amber' | 'teal' | 'green' | 'blue' | 'red'
  emptyMessage?: string
}

export function SummitListCard({
  title,
  summits,
  icon: Icon,
  color = 'teal',
  emptyMessage = 'No data available'
}: SummitListCardProps) {
  const colorClasses = {
    amber: 'border-l-amber-500',
    teal: 'border-l-teal-500',
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    red: 'border-l-red-500'
  }

  const iconColorClasses = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30'
  }

  return (
    <div className={`card-technical rounded-none border-l-4 p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <div className={`p-2 rounded border ${iconColorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <h3 className="font-display text-lg tracking-wider text-teal-300">
          {title}
        </h3>
      </div>

      {summits.length === 0 ? (
        <div className="text-sm text-teal-400/60 font-mono-data text-center py-4">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {summits.map((summit, index) => (
            <Link
              key={summit.ref}
              to={`/summit/${summit.ref.toLowerCase().replace(/\//g, '-')}`}
              className="block data-panel rounded p-2.5 hover:bg-teal-500/10 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-data text-teal-400/60">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-mono-data text-amber-400 group-hover:text-amber-300 transition-colors">
                      {summit.ref}
                    </span>
                  </div>
                  <div className="text-xs text-teal-100/80 truncate mt-0.5">
                    {summit.name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-mono-data text-green-400">
                    {summit.value}
                  </div>
                  <div className="text-[10px] text-teal-400/60 font-mono-data uppercase">
                    {summit.valueLabel}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
