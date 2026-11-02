import { useId } from 'react'
import { MapPin } from 'lucide-react'
import { SPORTS } from '@/lib/sports'
import type { LatLng, SportKey } from '@/types'
import { cn } from '@/lib/utils'

interface RouteThumbnailProps {
  route: LatLng[]
  sport: SportKey
  className?: string
  showGrid?: boolean
}

export function RouteThumbnail({
  route,
  sport,
  className,
  showGrid = true,
}: RouteThumbnailProps) {
  const id = useId().replaceAll(':', '')
  const meta = SPORTS[sport]
  const Icon = meta.icon

  if (route.length < 2) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden bg-[#11170e]',
          showGrid && 'app-grid',
          className,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(182,242,64,0.12),transparent_60%)]" />
        <div
          className="relative grid size-10 place-items-center rounded-full border border-white/10"
          style={{ color: meta.color, backgroundColor: `${meta.color}14` }}
        >
          <Icon className="size-5" />
        </div>
        <span className="absolute bottom-2 right-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">
          Indoor
        </span>
      </div>
    )
  }

  const lats = route.map((point) => point.lat)
  const lngs = route.map((point) => point.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const span = Math.max(maxLat - minLat, maxLng - minLng, 0.0001)
  const padding = 14
  const scale = (100 - padding * 2) / span

  const points = route.map((point) => {
    const x = padding + (point.lng - minLng + (span - (maxLng - minLng)) / 2) * scale
    const y = 100 - (padding + (point.lat - minLat + (span - (maxLat - minLat)) / 2) * scale)
    return [x, y] as const
  })

  const path = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  const start = points[0]
  const end = points[points.length - 1]

  return (
    <div className={cn('relative overflow-hidden bg-[#10150d]', className)}>
      {showGrid && <div className="app-grid absolute inset-0 opacity-80" />}
      <div
        className="absolute -right-1/4 -top-1/4 size-2/3 rounded-full blur-3xl"
        style={{ backgroundColor: `${meta.color}18` }}
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`route-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={meta.color} />
            <stop offset="100%" stopColor="#b6f240" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={`url(#route-${id})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.2"
          transform="translate(0 1.2)"
        />
        <path
          d={path}
          fill="none"
          stroke={`url(#route-${id})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={start[0]} cy={start[1]} r="2.8" fill="#b6f240" />
        <circle cx={start[0]} cy={start[1]} r="1.2" fill="#10150d" />
        <circle
          cx={end[0]}
          cy={end[1]}
          r="2.6"
          fill="#ff7a45"
          stroke="#10150d"
          strokeWidth="1"
        />
      </svg>
      <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/65 backdrop-blur-sm">
        <MapPin className="size-2.5" style={{ color: meta.color }} />
        Rute
      </div>
    </div>
  )
}
