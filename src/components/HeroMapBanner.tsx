import { MapPinIcon as MapPin, CursorArrowRaysIcon as Navigation, ArrowTrendingUpIcon as TrendingUp } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface HeroMapBannerProps {
  totalSummits?: number | null
  isOnline: boolean
}

interface DotPosition {
  cx: number
  cy: number
  r: number
  opacity: number
  delay: number
}

export function HeroMapBanner({ totalSummits, isOnline }: HeroMapBannerProps) {
  const { t } = useTranslation()
  const [animatedCount, setAnimatedCount] = useState(0)

  // Pre-generate random positions for dots to avoid impure calls during render
  const dotPositions = useMemo(() => {
    const generateDots = (count: number, baseX: number, rangeX: number, baseY: number, rangeY: number): DotPosition[] => {
      return Array.from({ length: count }, () => ({
        cx: baseX + Math.random() * rangeX,
        cy: baseY + Math.random() * rangeY,
        r: 1.5 + Math.random() * 1,
        opacity: 0.4 + Math.random() * 0.3,
        delay: Math.random() * 3
      }))
    }

    return {
      northAmerica: generateDots(15, 100, 80, 80, 60),
      europe: generateDots(20, 380, 60, 70, 50),
      asia: generateDots(25, 500, 120, 90, 80),
      southAmerica: generateDots(12, 180, 60, 170, 80),
      australia: generateDots(8, 650, 50, 200, 40)
    }
  }, [])

  // Animate summit counter
  useEffect(() => {
    if (!totalSummits) return

    const duration = 2000 // 2 seconds
    const steps = 60
    const increment = totalSummits / steps
    let current = 0

    const timer = window.setInterval(() => {
      current += increment
      if (current >= totalSummits) {
        setAnimatedCount(totalSummits)
        window.clearInterval(timer)
      } else {
        setAnimatedCount(Math.floor(current))
      }
    }, duration / steps)

    return () => window.clearInterval(timer)
  }, [totalSummits])

  return (
    <Link
      to="/nearby"
      className="block group animate-fade-in"
    >
      <div className="relative overflow-hidden rounded-none border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-950/40 via-black/60 to-teal-950/40 hover:from-blue-900/50 hover:via-black/70 hover:to-teal-900/50 transition-all duration-500">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0 bg-grid-pattern animate-grid-scroll"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(34 211 238 / 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(34 211 238 / 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-10 left-20 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slower" />

        {/* World Map Dots Pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
            {/* Simplified world map as dot clusters */}
            {/* North America */}
            <g className="animate-fade-in-delayed-1">
              {dotPositions.northAmerica.map((dot, i) => (
                <circle
                  key={`na-${i}`}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  fill="rgb(34 211 238)"
                  opacity={dot.opacity}
                  className="animate-twinkle"
                  style={{ animationDelay: `${dot.delay}s` }}
                />
              ))}
            </g>

            {/* Europe */}
            <g className="animate-fade-in-delayed-2">
              {dotPositions.europe.map((dot, i) => (
                <circle
                  key={`eu-${i}`}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  fill="rgb(34 211 238)"
                  opacity={dot.opacity}
                  className="animate-twinkle"
                  style={{ animationDelay: `${dot.delay}s` }}
                />
              ))}
            </g>

            {/* Asia */}
            <g className="animate-fade-in-delayed-3">
              {dotPositions.asia.map((dot, i) => (
                <circle
                  key={`as-${i}`}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  fill="rgb(34 211 238)"
                  opacity={dot.opacity}
                  className="animate-twinkle"
                  style={{ animationDelay: `${dot.delay}s` }}
                />
              ))}
            </g>

            {/* South America */}
            <g className="animate-fade-in-delayed-4">
              {dotPositions.southAmerica.map((dot, i) => (
                <circle
                  key={`sa-${i}`}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  fill="rgb(34 211 238)"
                  opacity={dot.opacity}
                  className="animate-twinkle"
                  style={{ animationDelay: `${dot.delay}s` }}
                />
              ))}
            </g>

            {/* Australia */}
            <g className="animate-fade-in-delayed-5">
              {dotPositions.australia.map((dot, i) => (
                <circle
                  key={`au-${i}`}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  fill="rgb(34 211 238)"
                  opacity={dot.opacity}
                  className="animate-twinkle"
                  style={{ animationDelay: `${dot.delay}s` }}
                />
              ))}
            </g>

            {/* Connection lines between continents (subtle) */}
            <line x1="180" y1="110" x2="380" y2="100" stroke="rgb(34 211 238)" strokeWidth="0.5" opacity="0.15" className="animate-draw-line" />
            <line x1="440" y1="90" x2="550" y2="120" stroke="rgb(34 211 238)" strokeWidth="0.5" opacity="0.15" className="animate-draw-line" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left: Text Content */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-400/60 text-xs font-mono-data tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>{t('hero.gpsLocationFinder')}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display leading-tight">
                  <span className="glow-blue">{t('hero.findNearest')}</span>
                  <br />
                  <span className="glow-amber">{t('hero.sotaSummits')}</span>
                </h2>

                <p className="text-teal-200/70 text-sm sm:text-base font-mono-data leading-relaxed">
                  {t('hero.description')}
                </p>

                <div className="flex items-center gap-4 pt-2">
                  <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-sm">
                    <div className="text-xs font-mono-data text-blue-400/60 mb-1">{t('hero.worldwide')}</div>
                    <div className="text-2xl font-mono-data glow-blue">
                      {totalSummits ? animatedCount.toLocaleString() : '---'}
                    </div>
                  </div>

                  <div className="text-xs font-mono-data text-teal-400/60 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {isOnline ? t('hero.onlineMode') : t('hero.offlineMode')}
                  </div>
                </div>

                <div className="pt-4">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-teal-500/20 border border-blue-500/40 rounded-sm group-hover:border-blue-400/60 group-hover:bg-gradient-to-r group-hover:from-blue-500/30 group-hover:to-teal-500/30 transition-all duration-300">
                    <Navigation className="w-5 h-5 text-blue-400 group-hover:rotate-45 transition-transform duration-500" />
                    <span className="font-display text-lg tracking-wider text-blue-300">
                      {t('hero.activateGPS')}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Right: Visual Element - Screenshot */}
              <div className="hidden md:flex items-center justify-center">
                <div className="relative group">
                  {/* Glowing border effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-500" />

                  {/* Screenshot with frame */}
                  <div className="relative">
                    <img
                      src={`${import.meta.env.BASE_URL}images/mountain-seeker-screenshot.png`}
                      alt={t('hero.imageAlt')}
                      className="relative rounded-lg border-2 border-blue-500/40 shadow-2xl group-hover:border-blue-400/60 transition-all duration-300"
                      loading="lazy"
                      width="600"
                      height="318"
                    />

                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-400/60" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-400/60" />

                    {/* Floating indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500/80 rounded-full border-2 border-blue-300 flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </Link>
  )
}
