import type { SportKey } from '@/types'

export const DEFAULT_CENTER = { lat: -6.2185, lng: 106.802 }

export function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadius = 6_371_000
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * earthRadius * Math.asin(Math.sqrt(h))
}

export function routeDistance(points: { lat: number; lng: number }[]) {
  let total = 0

  for (let index = 1; index < points.length; index += 1) {
    total += haversineDistance(points[index - 1], points[index])
  }

  return total
}

/**
 * Creates a smooth, deterministic loop so the demo and mock data have
 * realistic-looking GPS traces without relying on external services.
 */
export function loopRoute(
  center = DEFAULT_CENTER,
  radiusKm = 0.8,
  count = 72,
  wobble = 0.12,
) {
  const latRadius = radiusKm / 111
  const lngRadius = radiusKm / (111 * Math.cos(toRadians(center.lat)))

  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = (index / count) * Math.PI * 2
    const variation = 1 + Math.sin(angle * 3) * wobble + Math.cos(angle * 5) * 0.04

    return {
      lat: center.lat + Math.sin(angle) * latRadius * variation,
      lng: center.lng + Math.cos(angle) * lngRadius * variation,
    }
  })
}

export function pointAlongRoute(points: { lat: number; lng: number }[], progress: number) {
  if (points.length === 0) return DEFAULT_CENTER

  const normalized = Math.min(Math.max(progress, 0), 1)
  const index = Math.min(
    Math.floor(normalized * (points.length - 1)),
    points.length - 1,
  )
  return points[index]
}

export function estimateCalories(
  sport: SportKey,
  durationS: number,
  distanceM: number,
  weightKg = 68,
) {
  const metBySport: Record<SportKey, number> = {
    run: 9.8,
    ride: 7.5,
    walk: 3.8,
    hike: 6.5,
    swim: 7,
    gym: 5,
    football: 8,
    yoga: 3,
  }

  const hours = durationS / 3600
  const base = metBySport[sport] * weightKg * hours

  // Very short sessions should still reflect their intensity.
  const distanceBoost = sport === 'ride' ? distanceM / 1000 / 35 : distanceM / 1000 / 12
  return Math.round(Math.max(base, base * (0.85 + distanceBoost * 0.12)))
}

export function boundsCenter(points: { lat: number; lng: number }[], fallback = DEFAULT_CENTER) {
  if (points.length === 0) return fallback

  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length
  const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length
  return { lat, lng }
}

export function routeToTuples(points: { lat: number; lng: number }[]) {
  return points.map((point) => [point.lat, point.lng] as [number, number])
}
