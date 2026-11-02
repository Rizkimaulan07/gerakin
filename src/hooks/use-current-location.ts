import { useCallback, useEffect, useRef, useState } from 'react'
import type { LatLng } from '@/types'
import { api } from '@/lib/api'

export type LocationStatus =
  | 'idle'
  | 'locating'
  | 'ready'
  | 'denied'
  | 'unavailable'
  | 'error'

export interface UserLocation {
  position: LatLng
  accuracy: number
}

export interface UserPlace {
  label: string
  city: string | null
}

export function useCurrentLocation(auto = true) {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [place, setPlace] = useState<UserPlace | null>(null)
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      setError('Perangkat ini tidak mendukung GPS browser.')
      return
    }

    setStatus('locating')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current) return
        setLocation({
          position: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
        })
        setStatus('ready')
      },
      (geolocationError) => {
        if (!mounted.current) return
        if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
          setStatus('denied')
          setError('Izin lokasi ditolak. Aktifkan izin lokasi di browser untuk melihat posisimu.')
        } else if (geolocationError.code === geolocationError.POSITION_UNAVAILABLE) {
          setStatus('unavailable')
          setError('Lokasi tidak tersedia. Coba cari area dengan sinyal GPS lebih baik.')
        } else {
          setStatus('error')
          setError('GPS membutuhkan waktu terlalu lama. Coba lagi sebentar.')
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
    )
  }, [])

  useEffect(() => {
    if (auto) requestLocation()
  }, [auto, requestLocation])

  useEffect(() => {
    if (!location) return

    let cancelled = false
    api
      .reverseGeocode(location.position.lat, location.position.lng)
      .then((result) => {
        if (cancelled) return
        const label = result.label ?? result.city
        if (label) setPlace({ label, city: result.city })
      })
      .catch(() => {
        // Reverse geocoding is optional; the map still works without a place name.
      })

    return () => {
      cancelled = true
    }
  }, [location])

  return {
    location,
    place,
    status,
    error,
    requestLocation,
    isLocating: status === 'locating',
  }
}
