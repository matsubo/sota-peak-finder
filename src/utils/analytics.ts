// Google Tag Manager DataLayer helper functions

interface DataLayerEvent {
  event: string
  [key: string]: unknown
}

declare global {
  interface Window {
    dataLayer: DataLayerEvent[]
  }
}

// Initialize dataLayer if not exists
if (typeof window !== 'undefined' && !window.dataLayer) {
  window.dataLayer = []
}

/**
 * Push event to GTM dataLayer
 */
export const pushToDataLayer = (event: DataLayerEvent) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event)
  }
}

/**
 * Track location fetch success
 */
export const trackLocationFetchSuccess = (data: {
  latitude: number
  longitude: number
  accuracy?: number
  hasElevation: boolean
  hasAddress: boolean
  isOnline: boolean
}) => {
  pushToDataLayer({
    event: 'location_fetch_success',
    location_data: {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      has_elevation: data.hasElevation,
      has_address: data.hasAddress,
      is_online: data.isOnline
    }
  })
}

/**
 * Track location fetch error
 */
export const trackLocationFetchError = (errorType: string, errorMessage?: string) => {
  pushToDataLayer({
    event: 'location_fetch_error',
    error_type: errorType,
    error_message: errorMessage
  })
}

/**
 * Track language change
 */
export const trackLanguageChange = (fromLang: string, toLang: string) => {
  pushToDataLayer({
    event: 'language_change',
    from_language: fromLang,
    to_language: toLang
  })
}

/**
 * Track SOTA summit view
 */
export const trackSotaSummitView = (summitCount: number, nearestSummitRef: string, nearestDistance: number) => {
  pushToDataLayer({
    event: 'sota_summit_view',
    summit_count: summitCount,
    nearest_summit_ref: nearestSummitRef,
    nearest_distance_meters: nearestDistance
  })
}

/**
 * Track offline mode detection
 */
export const trackOfflineMode = (isOffline: boolean) => {
  pushToDataLayer({
    event: 'offline_mode',
    is_offline: isOffline
  })
}

/**
 * Track page view (for SPA routing)
 */
export const trackPageView = (pagePath: string, pageTitle: string) => {
  pushToDataLayer({
    event: 'page_view',
    page_path: pagePath,
    page_title: pageTitle
  })
}

/**
 * Track summit detail page view
 */
export const trackSummitView = (ref: string, points: number, altitudeM: number, assoc: string) => {
  pushToDataLayer({
    event: 'summit_view',
    summit_ref: ref,
    summit_points: points,
    summit_altitude_m: altitudeM,
    summit_association: assoc
  })
}

/**
 * Track bookmark status cycle (null → want_to_go → activated → null)
 */
export const trackBookmarkCycle = (
  ref: string,
  fromStatus: string | null,
  toStatus: string | null
) => {
  pushToDataLayer({
    event: 'bookmark_cycle',
    summit_ref: ref,
    from_status: fromStatus ?? 'none',
    to_status: toStatus ?? 'none'
  })
}

/**
 * Track bookmark removal from bookmarks page
 */
export const trackBookmarkRemove = (ref: string, previousStatus: string | null) => {
  pushToDataLayer({
    event: 'bookmark_remove',
    summit_ref: ref,
    previous_status: previousStatus ?? 'none'
  })
}

/**
 * Track position checker GPS watch start
 */
export const trackPositionCheckStart = (summitRef: string) => {
  pushToDataLayer({
    event: 'position_check_start',
    summit_ref: summitRef
  })
}

/**
 * Track position checker GPS watch stop
 */
export const trackPositionCheckStop = (summitRef: string) => {
  pushToDataLayer({
    event: 'position_check_stop',
    summit_ref: summitRef
  })
}

/**
 * Track position check result (first fix with altitude)
 */
export const trackPositionCheckResult = (
  summitRef: string,
  result: 'in_range' | 'out_of_range' | 'uncertain',
  vertDistM: number,
  horizDistM: number
) => {
  pushToDataLayer({
    event: 'position_check_result',
    summit_ref: summitRef,
    result,
    vert_dist_m: vertDistM,
    horiz_dist_m: horizDistM
  })
}
