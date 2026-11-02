import { ArrowUpRight, Clock3, Flame, MapPin, Mountain } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SPORTS } from '@/lib/sports'
import {
  formatDate,
  formatDistance,
  formatDurationShort,
  formatPace,
  formatSpeed,
  paceFromActivity,
  speedFromActivity,
} from '@/lib/format'
import type { Activity } from '@/types'
import { cn } from '@/lib/utils'
import { RouteThumbnail } from '@/components/route-thumbnail'
import { SportIcon } from '@/components/sport-icon'
import { Badge } from '@/components/ui/badge'

export function ActivityMetrics({
  activity,
  size = 'default',
  className,
}: {
  activity: Activity
  size?: 'sm' | 'default'
  className?: string
}) {
  const isRide = activity.sport === 'ride'
  const pace = paceFromActivity(activity.distanceM, activity.durationS)
  const speed = speedFromActivity(activity.distanceM, activity.durationS)

  return (
    <div
      className={cn(
        'grid grid-cols-3 divide-x divide-border/70 rounded-xl border border-border/60 bg-background/35',
        className,
      )}
    >
      <div className={cn('px-3', size === 'sm' ? 'py-2' : 'py-2.5')}>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Jarak
        </p>
        <p
          className={cn(
            'stat-number mt-0.5 font-display font-semibold text-foreground',
            size === 'sm' ? 'text-sm' : 'text-base',
          )}
        >
          {formatDistance(activity.distanceM)}
        </p>
      </div>
      <div className={cn('px-3', size === 'sm' ? 'py-2' : 'py-2.5')}>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Waktu
        </p>
        <p
          className={cn(
            'stat-number mt-0.5 font-display font-semibold text-foreground',
            size === 'sm' ? 'text-sm' : 'text-base',
          )}
        >
          {formatDurationShort(activity.durationS)}
        </p>
      </div>
      <div className={cn('px-3', size === 'sm' ? 'py-2' : 'py-2.5')}>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {isRide ? 'Kecepatan' : 'Pace'}
        </p>
        <p
          className={cn(
            'stat-number mt-0.5 font-display font-semibold text-foreground',
            size === 'sm' ? 'text-sm' : 'text-base',
          )}
        >
          {isRide ? formatSpeed(speed) : formatPace(pace)}
        </p>
      </div>
    </div>
  )
}

export function ActivityListCard({ activity }: { activity: Activity }) {
  const meta = SPORTS[activity.sport]
  const isRide = activity.sport === 'ride'
  const pace = paceFromActivity(activity.distanceM, activity.durationS)
  const speed = speedFromActivity(activity.distanceM, activity.durationS)

  return (
    <Link
      to={`/activities/${activity.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_16px_40px_-30px_rgba(182,242,64,0.5)] sm:flex-row"
    >
      <RouteThumbnail
        route={activity.route}
        sport={activity.sport}
        className="h-36 w-full shrink-0 sm:h-auto sm:w-44"
      />
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <SportIcon sport={activity.sport} size="sm" />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="truncate text-[10px] font-medium text-muted-foreground">
            {formatDate(activity.date)}
          </span>
        </div>

        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {activity.title}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{activity.location}</span>
            </p>
          </div>
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
            <ArrowUpRight className="size-4" />
          </span>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-3 pt-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Jarak</p>
            <p className="stat-number font-display text-sm font-semibold text-foreground">
              {formatDistance(activity.distanceM)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Waktu</p>
            <p className="stat-number font-display text-sm font-semibold text-foreground">
              {formatDurationShort(activity.durationS)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {isRide ? 'Kecepatan' : 'Pace'}
            </p>
            <p className="stat-number font-display text-sm font-semibold text-foreground">
              {isRide ? formatSpeed(speed) : formatPace(pace)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function ActivityMiniCard({ activity }: { activity: Activity }) {
  return (
    <Link
      to={`/activities/${activity.id}`}
      className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary/50"
    >
      <RouteThumbnail
        route={activity.route}
        sport={activity.sport}
        showGrid={false}
        className="size-12 shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary">
          {activity.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{formatDate(activity.date).split('•')[0]}</span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            <Clock3 className="size-2.5" /> {formatDurationShort(activity.durationS)}
          </span>
          <span className="flex items-center gap-0.5">
            <Mountain className="size-2.5" /> {activity.elevationM} m
          </span>
        </div>
      </div>
      <Badge variant="secondary" className="hidden sm:inline-flex">
        <Flame className="size-2.5" /> {activity.calories}
      </Badge>
    </Link>
  )
}
