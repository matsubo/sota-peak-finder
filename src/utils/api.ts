import type { LocationData, Location, GeocodingResult, SotaData, SotaSummitWithDistance } from '../types/location'
import { haversineDistance, calculateBearing, bearingToCardinal } from './coordinate'

/**
 * 国土地理院APIで標高を取得
 */
export async function getElevation(lat: number, lon: number): Promise<number | null> {
  try {
    const url = `https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=${lon}&lat=${lat}&outtype=JSON`
    const response = await fetch(url)
    const data = await response.json()

    if (data.elevation !== undefined && data.elevation !== null) {
      return Math.round(data.elevation)
    }
  } catch (error) {
    console.log('標高取得エラー:', error)
  }
  return null
}

/**
 * 逆ジオコーディング（OpenStreetMap Nominatim）
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ja`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OfflineQTH/2.0'
      }
    })
    const data = await response.json()

    if (data.address) {
      const addr = data.address
      const prefecture = addr.state || addr.province || ''
      const city = addr.city || addr.town || addr.village || addr.municipality || ''

      return {
        prefecture,
        city,
        fullAddress: data.display_name
      }
    }
  } catch (error) {
    console.log('逆ジオコーディングエラー:', error)
  }
  return null
}

/**
 * JCC/JCGデータのロード
 */
export async function loadLocationData(): Promise<LocationData | null> {
  try {
    const basePath = import.meta.env.BASE_URL || '/'
    const response = await fetch(`${basePath}data/location-data.json`)
    const data = await response.json()
    console.log('Location data loaded successfully:', data)
    return data
  } catch (error) {
    console.error('Failed to load location data:', error)
    return null
  }
}

/**
 * 位置情報から都道府県・市区町村・JCC/JCGを判定
 */
export function findLocationInfo(
  lat: number,
  lon: number,
  locationData: LocationData | null
): { prefecture: string; city: string; jcc: string; jcg: string } {
  if (!locationData || !locationData.locations) {
    return {
      prefecture: 'location.unknown',
      city: 'location.unknown',
      jcc: 'location.unknown',
      jcg: 'location.unknown'
    }
  }

  // 最も近い地点を探す
  let minDistance = Infinity
  let closestLocation: Location | null = null

  for (const location of locationData.locations) {
    const distance = Math.sqrt(
      Math.pow(lat - location.lat, 2) +
      Math.pow(lon - location.lon, 2)
    )

    if (distance < minDistance) {
      minDistance = distance
      closestLocation = location
    }
  }

  if (closestLocation) {
    return {
      prefecture: closestLocation.prefecture,
      city: closestLocation.city,
      jcc: closestLocation.jcc,
      jcg: closestLocation.jcg
    }
  }

  return {
    prefecture: 'location.unknown',
    city: 'location.unknown',
    jcc: 'location.unknown',
    jcg: 'location.unknown'
  }
}

/**
 * SOTAデータのロード
 */
export async function loadSotaData(): Promise<SotaData | null> {
  try {
    const basePath = import.meta.env.BASE_URL || '/'
    const response = await fetch(`${basePath}data/sota-data.json`)
    const data = await response.json()
    console.log('SOTA data loaded successfully:', data)
    return data
  } catch (error) {
    console.error('Failed to load SOTA data:', error)
    return null
  }
}

/**
 * 現在地から最寄りのSOTA山頂を検索
 *
 * @param lat 現在地の緯度
 * @param lon 現在地の経度
 * @param sotaData SOTAデータ
 * @param limit 取得する山頂数（デフォルト3）
 * @returns 最寄りのSOTA山頂リスト（距離順、距離・方位情報を含む）
 */
export function findNearbySotaSummits(
  lat: number,
  lon: number,
  sotaData: SotaData | null,
  limit: number = 3
): SotaSummitWithDistance[] {
  if (!sotaData || !sotaData.summits) {
    return []
  }

  // 各山頂までの距離と方位を計算し、距離順にソート
  const nearbySummits = sotaData.summits
    .map(summit => {
      const distance = haversineDistance(lat, lon, summit.lat, summit.lon)
      const bearing = calculateBearing(lat, lon, summit.lat, summit.lon)
      const cardinalBearing = bearingToCardinal(bearing)
      return {
        ...summit,
        distance,
        bearing,
        cardinalBearing,
        isActivationZone: false, // 初期値
        verticalDistance: null // 標高差（現在地の標高が必要なため、後で計算）
      }
    })
    .sort((a, b) => a.distance - b.distance) // 距離順にソート
    .slice(0, limit) // 上位limit件を取得

  return nearbySummits
}
