export interface LocationData {
  version: string
  lastUpdate: string
  locations: Location[]
}

export interface Location {
  lat: number
  lon: number
  prefecture: string
  city: string
  jcc: string
  jcg: string
}

export interface QTHInfo {
  latitude: string
  longitude: string
  latRaw: number
  lonRaw: number
  gridLocator: string
  elevation: string
  prefecture: string
  city: string
  jcc: string
  jcg: string
  accuracy: number | null // Location accuracy (meters)
  sotaSummits?: SotaSummitWithDistance[]  // List of nearest SOTA summits (optional)
}

export interface SotaSummitWithDistance extends SotaSummit {
  distance: number  // Distance (meters)
  isActivationZone: boolean // Whether within SOTA activation zone
  bearing: number // Bearing (degrees)
  cardinalBearing: string // 8-point compass direction
  verticalDistance: number | null // Elevation difference to summit (meters)
}

export interface GeocodingResult {
  prefecture: string
  city: string
  fullAddress?: string
}

// SOTA (Summits On The Air) type definitions
export interface SotaData {
  version: string
  lastUpdate: string
  region: string
  summits: SotaSummit[]
}

export interface SotaSummit {
  id?: number           // Database ID (optional, from SQLite)
  ref: string           // SOTA reference number (e.g., JA/WK-001)
  name: string          // Summit name
  lat: number           // Latitude
  lon: number           // Longitude
  altitude: number      // Elevation (meters)
  points: number        // SOTA points
  activations?: number  // Activation count (optional)
  bonus?: number | null // Bonus points (optional)
  association?: string  // SOTA Association (e.g., Japan, USA)
  region?: string       // SOTA Region (e.g., JA/NS, W7W)
}
