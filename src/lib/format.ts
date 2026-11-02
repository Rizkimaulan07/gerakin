import { format, formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export function formatDistance(meters: number, decimals = 2) {
  if (meters < 1000) return `${Math.max(0, Math.round(meters))} m`
  return `${(meters / 1000).toFixed(decimals)} km`
}

export function formatDistanceValue(meters: number, decimals = 2) {
  return (meters / 1000).toFixed(decimals)
}

export function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = safe % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatDurationShort(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.round((safe % 3600) / 60)

  if (hours > 0) return `${hours}j ${minutes}m`
  return `${minutes} mnt`
}

export function formatPace(secondsPerKm: number) {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return '—'
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)

  if (seconds === 60) return `${minutes + 1}:00 /km`
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`
}

export function formatClockPace(secondsPerKm: number) {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return '—'
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatSpeed(kmh: number) {
  if (!Number.isFinite(kmh) || kmh <= 0) return '—'
  return `${kmh.toFixed(1)} km/j`
}

export function formatDate(iso: string) {
  return format(new Date(iso), 'd MMM yyyy • HH.mm', { locale: localeId })
}

export function formatShortDate(iso: string) {
  return format(new Date(iso), 'd MMM', { locale: localeId })
}

export function formatRelative(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: localeId })
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

export function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function paceFromActivity(distanceM: number, durationS: number) {
  if (distanceM <= 0) return 0
  return durationS / (distanceM / 1000)
}

export function speedFromActivity(distanceM: number, durationS: number) {
  if (durationS <= 0) return 0
  return distanceM / 1000 / (durationS / 3600)
}
