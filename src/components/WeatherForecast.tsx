import { useTranslation } from 'react-i18next'
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  Wind,
  Droplets,
  AlertTriangle
} from 'lucide-react'
import { useWeatherForecast } from '../hooks/useWeatherForecast'
import { wmoCodeToCondition, type WeatherCondition } from '../utils/weather'

interface WeatherForecastProps {
  lat: number
  lon: number
  elevation: number
}

function WeatherIcon({
  condition,
  className
}: {
  condition: WeatherCondition
  className?: string
}) {
  const iconClass = className || 'w-8 h-8'
  switch (condition) {
    case 'clear':
      return <Sun className={`${iconClass} text-amber-400`} />
    case 'partlyCloudy':
      return <CloudSun className={`${iconClass} text-amber-300`} />
    case 'cloudy':
      return <Cloud className={`${iconClass} text-gray-400`} />
    case 'fog':
      return <CloudFog className={`${iconClass} text-gray-500`} />
    case 'drizzle':
      return <CloudDrizzle className={`${iconClass} text-blue-400`} />
    case 'rain':
      return <CloudRain className={`${iconClass} text-blue-500`} />
    case 'snow':
      return <CloudSnow className={`${iconClass} text-blue-200`} />
    case 'showers':
      return <CloudRain className={`${iconClass} text-blue-400`} />
    case 'thunderstorm':
      return <CloudLightning className={`${iconClass} text-yellow-400`} />
  }
}

function formatDayName(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric'
  }).format(date)
}

export function WeatherForecast({ lat, lon, elevation }: WeatherForecastProps) {
  const { t, i18n } = useTranslation()
  const { weather, loading, error } = useWeatherForecast(lat, lon, elevation)

  // Check if offline
  if (!navigator.onLine && !weather) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in border-l-4 border-l-teal-500/50">
        <div className="text-sm font-mono-data text-teal-400/60">
          {t('weather.unavailableOffline')}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Cloud className="w-5 h-5 text-teal-400 animate-pulse" />
          <span className="text-sm font-mono-data text-teal-400/60">
            {t('weather.loading')}
          </span>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="card-technical rounded p-6 animate-fade-in border-l-4 border-l-orange-500/50">
        <div className="text-sm font-mono-data text-orange-400/80">
          {t('weather.loadError')}
        </div>
      </div>
    )
  }

  // Find max wind gust across all days for warning
  const maxGust = Math.max(...weather.days.map((d) => d.windGustsMax))
  const WIND_WARNING_THRESHOLD = 30

  return (
    <div className="card-technical rounded p-6 animate-fade-in">
      <h2 className="text-xl font-display glow-teal mb-1 flex items-center">
        <Cloud className="w-5 h-5 mr-2" />
        {t('weather.title')}
      </h2>
      <p className="text-xs font-mono-data text-teal-400/60 mb-4">
        {t('weather.altitudeAdjusted', {
          elevation: Math.round(weather.elevation)
        })}
      </p>

      {/* 7-day forecast grid */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="grid grid-cols-7 gap-2 min-w-[560px]">
          {weather.days.map((day) => {
            const condition = wmoCodeToCondition(day.weatherCode)
            const isWindy = day.windGustsMax >= WIND_WARNING_THRESHOLD
            const isRainy = day.precipitationSum >= 5

            return (
              <div
                key={day.date}
                className="data-panel p-3 rounded text-center space-y-2"
              >
                {/* Day name */}
                <div className="text-xs font-mono-data text-teal-400 tracking-wider">
                  {formatDayName(day.date, i18n.language)}
                </div>
                <div className="text-[10px] font-mono text-gray-500">
                  {formatDate(day.date, i18n.language)}
                </div>

                {/* Weather icon */}
                <div className="flex justify-center py-1">
                  <WeatherIcon condition={condition} />
                </div>

                {/* Temperature */}
                <div>
                  <div className="text-sm font-mono-data glow-amber">
                    {day.tempMax}°
                  </div>
                  <div className="text-xs font-mono-data text-gray-500">
                    {day.tempMin}°
                  </div>
                </div>

                {/* Wind */}
                <div
                  className={`flex items-center justify-center gap-1 text-xs font-mono-data ${isWindy ? 'text-orange-400' : 'text-gray-400'}`}
                >
                  <Wind className="w-3 h-3" />
                  <span>{day.windSpeedMax}</span>
                </div>

                {/* Precipitation */}
                {day.precipitationSum > 0 && (
                  <div
                    className={`flex items-center justify-center gap-1 text-xs font-mono-data ${isRainy ? 'text-amber-400' : 'text-blue-400/60'}`}
                  >
                    <Droplets className="w-3 h-3" />
                    <span>{day.precipitationSum.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Wind warning */}
      {maxGust >= WIND_WARNING_THRESHOLD && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded bg-orange-500/10 border border-orange-500/30">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span className="text-xs font-mono-data text-orange-300">
            {t('weather.windWarning', { speed: WIND_WARNING_THRESHOLD })}
          </span>
        </div>
      )}

      {/* Attribution */}
      <div className="mt-3 text-[10px] font-mono text-gray-600 text-right">
        {t('weather.poweredBy')}
      </div>
    </div>
  )
}
