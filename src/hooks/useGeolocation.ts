import { useState, useEffect, useCallback } from 'react'
import type { LocationData, QTHInfo } from '../types/location'
import { getElevation, reverseGeocode, findLocationInfo, findNearbySotaSummits } from '../utils/api'
import { convertToDMS, calculateGridLocator } from '../utils/coordinate'
import { useSotaData } from './useSotaData'

export function useGeolocation(locationData: LocationData | null) {
  const [status, setStatus] = useState('status.ready')
  const [location, setLocation] = useState<QTHInfo | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [error, setError] = useState<string | null>(null)
  const sotaData = useSotaData() // SOTAデータを読み込み

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

    // オフライン時はタイムアウトを短縮
    const timeout = navigator.onLine ? 10000 : 5000

    navigator.geolocation.getCurrentPosition(
      async (position) => {
                const lat = position.coords.latitude
                const lon = position.coords.longitude
                const altitudeGPS = position.coords.altitude
                const accuracy = position.coords.accuracy
        
                // 即座に表示できる情報をセット
                const initialData: QTHInfo = {
                  latitude: convertToDMS(lat, true),
                  longitude: convertToDMS(lon, false),
                  latRaw: lat,
                  lonRaw: lon,
                  accuracy,
                  gridLocator: calculateGridLocator(lat, lon),
                  elevation: altitudeGPS ? `${Math.round(altitudeGPS)}m (GPS)` : 'location.fetching',
                  prefecture: 'location.fetching',
                  city: 'location.fetching',
                  jcc: 'location.fetching',
                  jcg: 'location.fetching',
                  sotaSummits: findNearbySotaSummits(lat, lon, sotaData, 3)
                }
        
                setLocation(initialData)
                setStatus('status.fetchingDetails')
        
                let currentElevation: number | null = altitudeGPS ? Math.round(altitudeGPS) : null
        
                // オンラインの場合、API で詳細情報を取得
                if (navigator.onLine) {
                  try {
                    // 標高を取得
                    const elevationFromApi = await getElevation(lat, lon)
                    if (elevationFromApi !== null) {
                      initialData.elevation = `${elevationFromApi}m`
                      currentElevation = elevationFromApi
                    } else {
                      initialData.elevation = 'elevation.unavailable'
                    }
                  } catch (err) {
                    console.error('標高取得エラー:', err)
                    initialData.elevation = 'elevation.failed'
                  }
        
                  // 都道府県・市区町村を逆ジオコーディングAPIで取得
                  try {
                    const geoData = await reverseGeocode(lat, lon)
                    if (geoData && geoData.prefecture && geoData.city) {
                      // API成功時はそのまま使用
                      initialData.prefecture = geoData.prefecture
                      initialData.city = geoData.city
                    } else {
                      // APIが空の結果を返した場合、ローカルデータにフォールバック
                      const locationInfo = findLocationInfo(lat, lon, locationData)
                      initialData.prefecture = locationInfo.prefecture
                      initialData.city = locationInfo.city
                    }
                  } catch (err) {
                    console.error('逆ジオコーディングエラー:', err)
                    // APIエラー時、ローカルデータにフォールバック
                    const locationInfo = findLocationInfo(lat, lon, locationData)
                    initialData.prefecture = locationInfo.prefecture
                    initialData.city = locationInfo.city
                  }
        
                  // JCC/JCGは常にローカルデータから取得（最寄りの市区町村で判定）
                  const locationInfo = findLocationInfo(lat, lon, locationData)
                  initialData.jcc = locationInfo.jcc
                  initialData.jcg = locationInfo.jcg
                } else {
                  // オフラインの場合
                  const locationInfo = findLocationInfo(lat, lon, locationData)
                  initialData.prefecture = locationInfo.prefecture !== 'location.unknown' ? `${locationInfo.prefecture} (推定)` : 'location.unknown'
                  initialData.city = locationInfo.city !== 'location.unknown' ? `${locationInfo.city} (推定)` : 'location.unknown'
                  initialData.jcc = locationInfo.jcc
                  initialData.jcg = locationInfo.jcg
                  initialData.elevation = 'elevation.unavailable'
                }
        
                // SOTA アクティベーションゾーン判定
                if (initialData.sotaSummits && currentElevation !== null) {
                  initialData.sotaSummits.forEach(summit => {
                    const verticalDistance = Math.abs(currentElevation! - summit.altitude)
                    // 標高差25m以内、かつ水平距離100m以内
                    summit.isActivationZone = verticalDistance <= 25 && summit.distance <= 100
                  })
                }
        
                setLocation({ ...initialData })
                setStatus(navigator.onLine ? 'status.success' : 'status.offline')
              },      (error) => {
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
        timeout,
        maximumAge: 300000 // 5分間はキャッシュを使用（オフライン対応）
      }
    )
  }, [locationData])

  // 初回自動取得を削除（ユーザージェスチャーが必要なため）
  // ユーザーが「Refetch」ボタンをクリックした時のみ取得する

  return {
    status,
    location,
    isOnline,
    error,
    refetch: fetchLocation
  }
}
