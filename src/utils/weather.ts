export interface WeatherDay {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  precipitationSum: number
  windSpeedMax: number
  windGustsMax: number
}

export interface WeatherForecastData {
  days: WeatherDay[]
  elevation: number
  fetchedAt: string
}

/**
 * Map WMO weather codes to descriptive keys for icons and i18n.
 * Full spec: https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
 */
export type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'showers'
  | 'thunderstorm'

export function wmoCodeToCondition(code: number): WeatherCondition {
  if (code === 0) return 'clear'
  if (code <= 2) return 'partlyCloudy'
  if (code === 3) return 'cloudy'
  if (code >= 45 && code <= 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'showers'
  if (code >= 95 && code <= 99) return 'thunderstorm'
  return 'cloudy' // fallback
}

/**
 * Fetch 7-day forecast from Open-Meteo for a given summit.
 * Uses elevation parameter for altitude-adjusted temperatures.
 */
export async function fetchWeatherForecast(
  lat: number,
  lon: number,
  elevation: number
): Promise<WeatherForecastData> {
  const daily = [
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'wind_speed_10m_max',
    'wind_gusts_10m_max',
    'weather_code'
  ].join(',')

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat.toFixed(4)}` +
    `&longitude=${lon.toFixed(4)}` +
    `&elevation=${elevation}` +
    `&daily=${daily}` +
    `&timezone=auto` +
    `&forecast_days=7`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`)
  }

  const data = await response.json()

  const days: WeatherDay[] = data.daily.time.map(
    (date: string, i: number) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      precipitationSum: data.daily.precipitation_sum[i],
      windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i]),
      windGustsMax: Math.round(data.daily.wind_gusts_10m_max[i])
    })
  )

  return {
    days,
    elevation: data.elevation,
    fetchedAt: new Date().toISOString()
  }
}
