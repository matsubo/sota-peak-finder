import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue with bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface SotaSummit {
  ref: string
  name: string
  nameEn: string
  lat: number
  lon: number
  altitude: number
  points: number
  distance: number
  bearing: number
  cardinalBearing: string
  isActivationZone: boolean
}

interface LocationMapProps {
  latitude: number
  longitude: number
  sotaSummits?: SotaSummit[]
  isOnline?: boolean
}

// Custom marker icons
const createCurrentLocationIcon = () => {
  return L.divIcon({
    className: 'current-location-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: rgb(51, 204, 204);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(51, 204, 204, 0.6), 0 0 20px rgba(51, 204, 204, 0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

const createSummitIcon = (isInRange: boolean) => {
  const color = isInRange ? 'rgb(102, 255, 153)' : 'rgb(255, 169, 51)'
  return L.divIcon({
    className: 'summit-marker',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: ${color};
        border: 2px solid rgba(0, 0, 0, 0.3);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 0 15px ${color}80;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  })
}

// Component to auto-fit bounds
function MapBounds({ latitude, longitude, sotaSummits }: LocationMapProps) {
  const map = useMap()

  useEffect(() => {
    if (sotaSummits && sotaSummits.length > 0) {
      const bounds = L.latLngBounds([
        [latitude, longitude],
        ...sotaSummits.map(s => [s.lat, s.lon] as [number, number])
      ])
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    } else {
      map.setView([latitude, longitude], 13)
    }
  }, [map, latitude, longitude, sotaSummits])

  return null
}

export function LocationMap({ latitude, longitude, sotaSummits = [], isOnline = true }: LocationMapProps) {
  return (
    <div className="card-technical rounded-none overflow-hidden corner-accent border-l-4 border-l-teal-500" style={{ height: '400px' }}>
      {!isOnline && (
        <div className="absolute top-2 left-2 z-[1000] bg-amber-500/90 text-black px-3 py-1 rounded text-xs font-mono-data">
          ⚠️ OFFLINE - Showing cached tiles only
        </div>
      )}
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />

        <MapBounds latitude={latitude} longitude={longitude} sotaSummits={sotaSummits} />

        {/* Current location marker */}
        <Marker position={[latitude, longitude]} icon={createCurrentLocationIcon()}>
          <Popup>
            <div className="font-mono-data text-xs">
              <div className="font-bold text-teal-600">Your Location</div>
              <div>{latitude.toFixed(6)}, {longitude.toFixed(6)}</div>
            </div>
          </Popup>
        </Marker>

        {/* SOTA summit markers */}
        {sotaSummits.map((summit) => (
          <div key={summit.ref}>
            {/* Activation zone circle (25m radius) */}
            {summit.isActivationZone && (
              <Circle
                center={[summit.lat, summit.lon]}
                radius={25}
                pathOptions={{
                  color: 'rgb(102, 255, 153)',
                  fillColor: 'rgb(102, 255, 153)',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            )}

            {/* Line from current location to summit */}
            <Polyline
              positions={[
                [latitude, longitude],
                [summit.lat, summit.lon]
              ]}
              pathOptions={{
                color: summit.isActivationZone ? 'rgb(102, 255, 153)' : 'rgb(255, 169, 51)',
                weight: 2,
                opacity: 0.6,
                dashArray: '10, 5'
              }}
            />

            {/* Summit marker */}
            <Marker
              position={[summit.lat, summit.lon]}
              icon={createSummitIcon(summit.isActivationZone)}
            >
              <Popup>
                <div className="font-mono-data text-xs space-y-1">
                  <div className="font-bold text-amber-600">{summit.ref}</div>
                  <div>{summit.name}</div>
                  <div className="text-gray-600">
                    {summit.distance < 1000
                      ? `${Math.round(summit.distance)}m`
                      : `${(summit.distance / 1000).toFixed(1)}km`
                    } {summit.cardinalBearing}
                  </div>
                  <div className="text-gray-600">
                    {summit.altitude}m / {summit.points} pts
                  </div>
                  {summit.isActivationZone && (
                    <div className="text-green-600 font-bold">✓ In Activation Zone</div>
                  )}
                  {isOnline && (
                    <a
                      href={`https://www.sotamaps.org/index.php?smt=${summit.ref}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2 text-xs"
                    >
                      <span>View on SOTAmaps →</span>
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          </div>
        ))}
      </MapContainer>
    </div>
  )
}
