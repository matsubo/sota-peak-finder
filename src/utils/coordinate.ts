/**
 * Convert to DMS (Degrees, Minutes, Seconds) format
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
 * Calculate Maidenhead Grid Locator
 */
export function calculateGridLocator(lat: number, lon: number): string {
  // Convert longitude to 0-360 range
  let adjustedLon = lon + 180
  // Convert latitude to 0-180 range
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
 * Calculate distance between two points using Haversine formula (in meters)
 * Treats the Earth as a sphere for more accurate distance calculation
 *
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // In meters
}

/**
 * Calculate bearing between two points
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Bearing in degrees (0-360)
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
  const brng = ((θ * 180) / Math.PI + 360) % 360; // Convert to degrees and normalize to 0-360 range

  return brng;
}


/**
 * Convert bearing (degrees) to 8-point compass direction
 * @param bearing Bearing in degrees (0-360)
 * @returns 8-point compass direction string (N, NE, E, SE, S, SW, W, NW)
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}
