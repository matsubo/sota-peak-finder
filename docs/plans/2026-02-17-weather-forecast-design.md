# Weather Forecast for Summit Detail Page

## Summary

Add a 7-day weather forecast card to the summit detail page using Open-Meteo's free API. Altitude-adjusted forecasts help activators plan safe and successful summit trips.

## Approach

**Open-Meteo Direct API** - free, no API key, global coverage, altitude-aware forecasts. Called directly from the browser with Service Worker caching (1-hour TTL).

## API Integration

**Endpoint:** `https://api.open-meteo.com/v1/forecast`

**Request parameters:**
- `latitude`, `longitude` - from summit data
- `elevation` - summit altitude (enables altitude-adjusted forecast)
- `daily` - temperature_2m_max, temperature_2m_min, precipitation_sum, wind_speed_10m_max, wind_gusts_10m_max, weather_code
- `timezone=auto`
- `forecast_days=7`

**Data model:**
```typescript
interface WeatherDay {
  date: string
  weatherCode: number   // WMO code (0=clear, 1-3=cloudy, 45-48=fog, 51-67=rain, 71-77=snow, 80-82=showers, 95-99=thunderstorm)
  tempMax: number       // degrees C
  tempMin: number       // degrees C
  precipitationSum: number  // mm
  windSpeedMax: number  // km/h
  windGustsMax: number  // km/h
}

interface WeatherForecastData {
  days: WeatherDay[]
  elevation: number     // model elevation used
  fetchedAt: string     // ISO timestamp
}
```

## UI Design

**Placement:** Between "Location Map" and "Activation Information" sections on SummitPage.

**Layout:** 7-column grid (horizontal scroll on mobile) showing per-day:
- Day name (Mon, Tue, etc.)
- Weather icon (SVG via Lucide: Sun, Cloud, CloudRain, CloudSnow, Wind, CloudLightning)
- High/low temperature
- Max wind speed
- Precipitation total

**Safety alerts:** Highlighted warning when wind gusts > 30 km/h (important for antenna setup).

**Styling:** Matches vintage radio aesthetic - `card-technical`, `font-mono-data`, glow effects, teal/amber/green accents.

**Offline behavior:** Graceful "Weather unavailable offline" message (non-blocking).

## Files

### New files
- `src/components/WeatherForecast.tsx` - Weather card component
- `src/hooks/useWeatherForecast.ts` - Fetch/cache hook
- `src/utils/weather.ts` - API call, WMO code mapping, types

### Modified files
- `src/pages/SummitPage.tsx` - Add WeatherForecast between map and activation info
- `src/locales/ja/translation.json` - Japanese weather strings
- `src/locales/en/translation.json` - English weather strings
- `vite.config.ts` - Add Open-Meteo to Service Worker caching (CacheFirst, 1hr)

### No new dependencies
Uses native `fetch`, existing Lucide icons, existing i18n infrastructure.

## Error Handling

- **Network failure:** Show "Weather unavailable offline" with teal border
- **API error:** Log to console, show fallback message
- **Loading:** Skeleton shimmer matching existing card style

## Testing

- Playwright e2e test for weather card visibility on summit detail page
