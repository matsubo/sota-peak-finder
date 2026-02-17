import { useState, useEffect } from 'react'
import {
  fetchWeatherForecast,
  type WeatherForecastData
} from '../utils/weather'

interface UseWeatherForecastResult {
  weather: WeatherForecastData | null
  loading: boolean
  error: string | null
}

export function useWeatherForecast(
  lat: number | undefined,
  lon: number | undefined,
  elevation: number | undefined
): UseWeatherForecastResult {
  const hasParams = lat !== undefined && lon !== undefined && elevation !== undefined
  const [weather, setWeather] = useState<WeatherForecastData | null>(null)
  const [loading, setLoading] = useState(hasParams)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lat === undefined || lon === undefined || elevation === undefined) {
      return
    }

    let cancelled = false

    fetchWeatherForecast(lat, lon, elevation)
      .then((data) => {
        if (!cancelled) {
          setWeather(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Weather fetch failed:', err)
          setError(err instanceof Error ? err.message : 'Failed to load weather')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [lat, lon, elevation])

  return { weather, loading, error }
}
