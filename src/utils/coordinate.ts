/**
 * 度分秒（DMS）形式への変換
 */
export function convertToDMS(decimal: number, isLatitude: boolean): string {
  const absolute = Math.abs(decimal)
  const degrees = Math.floor(absolute)
  const minutesDecimal = (absolute - degrees) * 60
  const minutes = Math.floor(minutesDecimal)
  const seconds = ((minutesDecimal - minutes) * 60).toFixed(2)

  let direction: string
  if (isLatitude) {
    direction = decimal >= 0 ? 'N' : 'S'
  } else {
    direction = decimal >= 0 ? 'E' : 'W'
  }

  return `${degrees}°${minutes}'${seconds}" ${direction}`
}

/**
 * Maidenhead Grid Locator (グリッドロケーター) の計算
 */
export function calculateGridLocator(lat: number, lon: number): string {
  // 経度を0-360の範囲に変換
  let adjustedLon = lon + 180
  // 緯度を0-180の範囲に変換
  let adjustedLat = lat + 90

  // Field (A-R)
  const fieldLon = String.fromCharCode(65 + Math.floor(adjustedLon / 20))
  const fieldLat = String.fromCharCode(65 + Math.floor(adjustedLat / 10))

  // Square (0-9)
  adjustedLon = adjustedLon % 20
  adjustedLat = adjustedLat % 10
  const squareLon = Math.floor(adjustedLon / 2)
  const squareLat = Math.floor(adjustedLat / 1)

  // Subsquare (a-x)
  adjustedLon = (adjustedLon % 2) * 60
  adjustedLat = (adjustedLat % 1) * 60
  const subsquareLon = String.fromCharCode(97 + Math.floor(adjustedLon / 5))
  const subsquareLat = String.fromCharCode(97 + Math.floor(adjustedLat / 2.5))

  return `${fieldLon}${fieldLat}${squareLon}${squareLat}${subsquareLon}${subsquareLat}`
}

/**
 * ハバーサイン公式による2点間の距離計算（メートル）
 * 地球を球体として扱い、より正確な距離を計算
 *
 * @param lat1 地点1の緯度
 * @param lon1 地点1の経度
 * @param lat2 地点2の緯度
 * @param lon2 地点2の経度
 * @returns 距離（メートル）
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // メートル単位
}

/**
 * 2点間の方位を計算する
 * @param lat1 地点1の緯度
 * @param lon1 地点1の経度
 * @param lat2 地点2の緯度
 * @param lon2 地点2の経度
 * @returns 方位（0-360度）
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const brng = ((θ * 180) / Math.PI + 360) % 360; // 度数法に変換し、0-360の範囲に正規化

  return brng;
}


/**
 * 方位（度）を8方位の文字列に変換する
 * @param bearing 方位（0-360度）
 * @returns 8方位の文字列 (N, NE, E, SE, S, SW, W, NW)
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}
