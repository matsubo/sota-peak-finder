import { useState, useEffect, useCallback } from 'react'
import type { LocationData, QTHInfo } from '../types/location'
import { getElevation, reverseGeocode, findLocationInfo } from '../utils/api'
import { convertToDMS, calculateGridLocator } from '../utils/coordinate'

export function useGeolocation(locationData: LocationData | null) {
  const [status, setStatus] = useState('status.fetching')
  const [location, setLocation] = useState<QTHInfo | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [error, setError] = useState<string | null>(null)

  // オンライン/オフライン状態の監視
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('status.notSupported')
      setStatus('status.notSupported')
      return
    }

    setStatus('status.fetching')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        const altitudeGPS = position.coords.altitude

        // 即座に表示できる情報をセット
        const initialData: QTHInfo = {
          latitude: convertToDMS(lat, true),
          longitude: convertToDMS(lon, false),
          latRaw: lat,
          lonRaw: lon,
          gridLocator: calculateGridLocator(lat, lon),
          elevation: altitudeGPS ? `${Math.round(altitudeGPS)}m (GPS)` : 'location.fetching',
          prefecture: 'location.fetching',
          city: 'location.fetching',
          jcc: 'location.fetching',
          jcg: 'location.fetching'
        }

        setLocation(initialData)
        setStatus('status.fetchingDetails')

        // オンラインの場合、API で詳細情報を取得
        if (navigator.onLine) {
          try {
            // 標高を取得
            const elevation = await getElevation(lat, lon)
            if (elevation !== null) {
              initialData.elevation = `${elevation}m`
            } else {
              initialData.elevation = 'elevation.unavailable'
            }

            // 住所を取得
            const geoData = await reverseGeocode(lat, lon)
            if (geoData) {
              initialData.prefecture = geoData.prefecture || 'location.unknown'
              initialData.city = geoData.city || 'location.unknown'
            } else {
              initialData.prefecture = 'location.failed'
              initialData.city = 'location.failed'
            }
          } catch (err) {
            console.error('API取得エラー:', err)
            initialData.prefecture = 'location.failed'
            initialData.city = 'location.failed'
            initialData.elevation = 'elevation.failed'
          }

          // JCC/JCGを取得
          const locationInfo = findLocationInfo(lat, lon, locationData)
          initialData.jcc = locationInfo.jcc
          initialData.jcg = locationInfo.jcg

          setLocation({ ...initialData })
          setStatus('status.success')
        } else {
          // オフラインの場合
          const locationInfo = findLocationInfo(lat, lon, locationData)
          initialData.prefecture = locationInfo.prefecture !== '不明' ? `${locationInfo.prefecture} (推定)` : 'location.unknown'
          initialData.city = locationInfo.city !== '不明' ? `${locationInfo.city} (推定)` : 'location.unknown'
          initialData.jcc = locationInfo.jcc
          initialData.jcg = locationInfo.jcg
          initialData.elevation = 'elevation.unavailable'

          setLocation({ ...initialData })
          setStatus('status.offline')
        }
      },
      (error) => {
        let errorMessage = 'status.error'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'status.permissionDenied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'status.unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'status.timeout'
            break
          default:
            errorMessage = 'status.error'
        }
        setError(errorMessage)
        setStatus(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }, [locationData])

  // 初回自動取得
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLocation()
    }, 500)

    return () => clearTimeout(timer)
  }, [fetchLocation])

  return {
    status,
    location,
    isOnline,
    error,
    refetch: fetchLocation
  }
}
