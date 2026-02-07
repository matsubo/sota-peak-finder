import { useState, useEffect, useCallback } from 'react'
import type { LocationData, QTHInfo } from '../types/location'
import { getElevation, reverseGeocode, findLocationInfo, findJccJcgByCity, findNearbySotaSummits } from '../utils/api'
import { convertToDMS, calculateGridLocator } from '../utils/coordinate'
import { useSotaData } from './useSotaData'
import { trackLocationFetchSuccess, trackLocationFetchError, trackOfflineMode } from '../utils/analytics'

export function useGeolocation(locationData: LocationData | null) {
  const [status, setStatus] = useState('status.ready')
  const [location, setLocation] = useState<QTHInfo | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [error, setError] = useState<string | null>(null)
  const sotaData = useSotaData() // SOTAデータを読み込み

  // オンライン/オフライン状態の監視
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      trackOfflineMode(false)
    }
    const handleOffline = () => {
      setIsOnline(false)
      trackOfflineMode(true)
    }

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
                  sotaSummits: [] // 非同期で取得するため、初期値は空配列
                }

                setLocation(initialData)
                setStatus('status.fetchingDetails')

                // SOTA 山頂を非同期で取得
                // 5000km radius to always find 20 nearest summits regardless of distance
                findNearbySotaSummits(lat, lon, sotaData, 20, 5000).then(summits => {
                  initialData.sotaSummits = summits
                  setLocation({ ...initialData })
                }).catch(err => {
                  console.error('SOTA summits fetch error:', err)
                  initialData.sotaSummits = []
                })
        
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

                      // APIで取得した市区町村名からJCC/JCGを検索
                      const jccJcgData = findJccJcgByCity(geoData.city, locationData)
                      initialData.jcc = jccJcgData.jcc
                      initialData.jcg = jccJcgData.jcg
                    } else {
                      // APIが空の結果を返した場合、ローカルデータにフォールバック
                      const locationInfo = findLocationInfo(lat, lon, locationData)
                      initialData.prefecture = locationInfo.prefecture
                      initialData.city = locationInfo.city
                      initialData.jcc = locationInfo.jcc
                      initialData.jcg = locationInfo.jcg
                    }
                  } catch (err) {
                    console.error('逆ジオコーディングエラー:', err)
                    // APIエラー時、ローカルデータにフォールバック
                    const locationInfo = findLocationInfo(lat, lon, locationData)
                    initialData.prefecture = locationInfo.prefecture
                    initialData.city = locationInfo.city
                    initialData.jcc = locationInfo.jcc
                    initialData.jcg = locationInfo.jcg
                  }
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
        
                        if (initialData.sotaSummits) {
        
                          initialData.sotaSummits.forEach(summit => {
        
                            if (currentElevation !== null) {
        
                              const verticalDistance = currentElevation - summit.altitude
        
                              summit.verticalDistance = verticalDistance
        
                              // 標高差25m以内（下方向）、かつ水平距離100m以内
        
                              summit.isActivationZone = verticalDistance <= 25 && verticalDistance >= -25 && summit.distance <= 100
        
                            } else {
        
                              summit.verticalDistance = null
        
                              summit.isActivationZone = false
        
                            }
        
                          })
        
                        }
        
                
        
                        setLocation({ ...initialData })

                        setStatus(navigator.onLine ? 'status.success' : 'status.offline')

                        // Track location fetch success
                        trackLocationFetchSuccess({
                          latitude: lat,
                          longitude: lon,
                          accuracy,
                          hasElevation: currentElevation !== null,
                          hasAddress: initialData.prefecture !== 'location.unknown' && initialData.city !== 'location.unknown',
                          isOnline: navigator.onLine
                        })

                      },      (error) => {
        let errorMessage = 'status.error'
        let errorType = 'unknown'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'status.permissionDenied'
            errorType = 'permission_denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'status.unavailable'
            errorType = 'position_unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'status.timeout'
            errorType = 'timeout'
            break
          default:
            errorMessage = 'status.error'
            errorType = 'unknown'
        }
        setError(errorMessage)
        setStatus(errorMessage)

        // Track location fetch error
        trackLocationFetchError(errorType, error.message)
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 300000 // 5分間はキャッシュを使用（オフライン対応）
      }
    )
  }, [locationData, sotaData])

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
