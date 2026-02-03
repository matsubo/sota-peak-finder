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
  accuracy: number | null // 位置情報の精度（メートル）
  sotaSummits?: SotaSummitWithDistance[]  // 最寄りのSOTA山頂リスト（オプショナル）
}

export interface SotaSummitWithDistance extends SotaSummit {
  distance: number  // 距離（メートル）
  isActivationZone: boolean // SOTAアクティベーションゾーン内にいるか
  bearing: number // 方位（度）
  cardinalBearing: string // 8方位
  verticalDistance: number | null // 山頂との標高差（メートル）
}

export interface GeocodingResult {
  prefecture: string
  city: string
  fullAddress?: string
}

// SOTA (Summits On The Air) 関連の型定義
export interface SotaData {
  version: string
  lastUpdate: string
  region: string
  summits: SotaSummit[]
}

export interface SotaSummit {
  ref: string           // SOTA参照番号 (例: JA/WK-001)
  name: string          // 山名（日本語）
  nameEn: string        // 山名（英語）
  lat: number           // 緯度
  lon: number           // 経度
  altitude: number      // 標高（メートル）
  points: number        // SOTAポイント
  activations?: number  // アクティベーション回数（オプション）
  bonus?: number | null // ボーナスポイント（オプション）
}
