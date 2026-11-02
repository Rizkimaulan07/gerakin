import { useEffect, useRef } from 'react'
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LatLng } from '@/types'
import { DEFAULT_CENTER, routeToTuples } from '@/lib/geo'
import { cn } from '@/lib/utils'

interface CurrentLocation {
  position: LatLng
  accuracy: number
}

interface ActivityMapProps {
  route: LatLng[]
  className?: string
  interactive?: boolean
  follow?: boolean
  center?: LatLng
  focus?: LatLng | null
  focusNonce?: number
  currentLocation?: CurrentLocation | null
}

function MapSync({
  route,
  currentLocation,
  follow,
  focus,
  focusNonce,
}: {
  route: LatLng[]
  currentLocation?: CurrentLocation | null
  follow?: boolean
  focus?: LatLng | null
  focusNonce?: number
}) {
  const map = useMap()
  const hasFitted = useRef(false)
  const focusLat = focus?.lat
  const focusLng = focus?.lng

  useEffect(() => {
    const last = route[route.length - 1]
    const target = currentLocation?.position ?? last

    if (!target) {
      hasFitted.current = false
      return
    }

    if (!hasFitted.current) {
      if (route.length > 1 && !currentLocation) {
        const bounds = L.latLngBounds(route.map((point) => [point.lat, point.lng]))
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 })
      } else {
        map.setView([target.lat, target.lng], 16)
      }
      hasFitted.current = true
      return
    }

    if (follow) {
      map.panTo([target.lat, target.lng], { animate: true, duration: 0.6 })
    }
  }, [currentLocation, follow, map, route])

  useEffect(() => {
    if (focusLat === undefined || focusLng === undefined || route.length > 0) return
    map.setView([focusLat, focusLng], Math.max(map.getZoom(), 15))
    // Intentionally focus only when the detected coordinates change.
  }, [focusLat, focusLng, map, route.length])

  useEffect(() => {
    if (!focus || !focusNonce) return
    map.setView([focus.lat, focus.lng], Math.max(map.getZoom(), 15))
  }, [focus, focusNonce, map])

  return null
}

export function ActivityMap({
  route,
  className,
  interactive = true,
  follow = false,
  center,
  focus,
  focusNonce,
  currentLocation,
}: ActivityMapProps) {
  const fallbackCenter = center ?? DEFAULT_CENTER
  const mapCenter =
    route.length > 0
      ? route[Math.floor(route.length / 2)]
      : currentLocation?.position ?? fallbackCenter
  const positions = routeToTuples(route)

  return (
    <div className={cn('relative overflow-hidden bg-[#0f140d]', className)}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={14}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        className="h-full w-full"
      >
        <TileLayer
          attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          opacity={0.9}
        />
        <MapSync
          route={route}
          currentLocation={currentLocation}
          follow={follow}
          focus={focus}
          focusNonce={focusNonce}
        />

        {currentLocation && route.length === 0 && (
          <>
            <Circle
              center={[currentLocation.position.lat, currentLocation.position.lng]}
              radius={Math.min(currentLocation.accuracy, 500)}
              pathOptions={{
                color: '#52c7b8',
                fillColor: '#52c7b8',
                fillOpacity: 0.08,
                weight: 1,
                opacity: 0.35,
              }}
            />
          </>
        )}

        {positions.length > 1 && (
          <>
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#17200a',
                weight: 9,
                opacity: 0.55,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={positions}
              pathOptions={{
                color: '#b6f240',
                weight: 4,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}
        {route.length > 0 && (
          <CircleMarker
            center={[route[0].lat, route[0].lng]}
            radius={6}
            pathOptions={{
              color: '#0f140d',
              fillColor: '#b6f240',
              fillOpacity: 1,
              weight: 2,
            }}
          />
        )}
        {route.length > 1 && (
          <CircleMarker
            center={[route[route.length - 1].lat, route[route.length - 1].lng]}
            radius={6}
            pathOptions={{
              color: '#0f140d',
              fillColor: '#ff7a45',
              fillOpacity: 1,
              weight: 2,
            }}
          />
        )}
        {currentLocation && (
          <CircleMarker
            center={[currentLocation.position.lat, currentLocation.position.lng]}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#52c7b8',
              fillOpacity: 1,
              weight: 3,
            }}
          />
        )}
      </MapContainer>
      {route.length === 0 && !currentLocation && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20">
          <div className="rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white/65 backdrop-blur-md">
            Rute belum tersedia
          </div>
        </div>
      )}
    </div>
  )
}
