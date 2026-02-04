// Google Tag Manager DataLayer helper functions

interface DataLayerEvent {
  event: string
  [key: string]: any
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
