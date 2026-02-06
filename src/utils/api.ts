import type { LocationData, Location, GeocodingResult, SotaData, SotaSummitWithDistance } from '../types/location'
import { haversineDistance, calculateBearing, bearingToCardinal } from './coordinate'
import { sotaDatabase } from './sotaDatabase'

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

  // 最も近い地点を探す（Haversine距離を使用）
  let minDistance = Infinity
  let closestLocation: Location | null = null

  for (const location of locationData.locations) {
    // 球面距離（メートル）を計算
    const distance = haversineDistance(lat, lon, location.lat, location.lon)

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
 * 市区町村名からJCC/JCGを検索
 */
export function findJccJcgByCity(
  city: string,
  locationData: LocationData | null
): { jcc: string; jcg: string } {
  if (!locationData || !locationData.locations) {
    return {
      jcc: 'location.unknown',
      jcg: 'location.unknown'
    }
  }

  // 市区町村名で完全一致検索
  const location = locationData.locations.find(loc => loc.city === city)

  if (location) {
    return {
      jcc: location.jcc,
      jcg: location.jcg
    }
  }

  return {
    jcc: 'location.unknown',
    jcg: 'location.unknown'
  }
}

/**
 * SOTAデータベースの初期化
 *
 * SQLite WASMを使用して世界中のSOTAデータにアクセス可能にします
 *
 * @returns 初期化が成功したかどうか
 */
export async function initSotaDatabase(): Promise<boolean> {
  try {
    await sotaDatabase.init()
    return true
  } catch (error) {
    console.error('Failed to initialize SOTA database:', error)
    return false
  }
}

/**
 * SOTAデータのロード（後方互換性のため維持）
 *
 * @deprecated Use initSotaDatabase() instead for worldwide support
 */
export async function loadSotaData(): Promise<SotaData | null> {
  console.warn('loadSotaData() is deprecated. Database is initialized automatically.')
  try {
    await sotaDatabase.init()
    return {
      version: '2.0.0',
      lastUpdate: new Date().toISOString().split('T')[0],
      region: 'Worldwide',
      summits: [] // Empty array for backward compatibility
    }
  } catch (error) {
    console.error('Failed to load SOTA data:', error)
    return null
  }
}

/**
 * 現在地から最寄りのSOTA山頂を検索
 *
 * SQLite R*Tree spatial indexを使用して高速検索します
 *
 * @param lat 現在地の緯度
 * @param lon 現在地の経度
 * @param sotaData SOTAデータ（廃止予定、後方互換性のため保持）
 * @param limit 取得する山頂数（デフォルト10）
 * @param radiusKm 検索半径（km、デフォルト50km）
 * @returns 最寄りのSOTA山頂リスト（距離順、距離・方位情報を含む）
 */
export async function findNearbySotaSummits(
  lat: number,
  lon: number,
  _sotaData: SotaData | null = null,
  limit: number = 10,
  radiusKm: number = 50
): Promise<SotaSummitWithDistance[]> {
  try {
    // SQLiteデータベースから検索
    const summits = await sotaDatabase.findNearby(lat, lon, radiusKm, limit)

    // 距離情報に加えて方位情報を追加
    return summits.map(summit => {
      const bearing = calculateBearing(lat, lon, summit.lat, summit.lon)
      const cardinalBearing = bearingToCardinal(bearing)
      return {
        ...summit,
        distance: summit.distance * 1000, // Convert km to meters for consistency
        bearing,
        cardinalBearing,
        isActivationZone: false, // 初期値（後で標高情報と合わせて判定）
        verticalDistance: null // 標高差（現在地の標高が必要なため、後で計算）
      }
    })
  } catch (error) {
    console.error('Failed to find nearby SOTA summits:', error)
    return []
  }
}
