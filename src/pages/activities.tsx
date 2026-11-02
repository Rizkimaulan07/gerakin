import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarRange,
  Flame,
  Footprints,
  Mountain,
  Plus,
  Search,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { formatDurationShort, formatNumber } from '@/lib/format'
import { SPORTS } from '@/lib/sports'
import { ActivityListCard } from '@/components/activity-cards'
import { ManualActivityDialog } from '@/components/manual-activity-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SportKey } from '@/types'

const sportFilters: Array<{ value: string; label: string; sports?: SportKey[] }> = [
  { value: 'all', label: 'Semua' },
  { value: 'mine', label: 'Milikku' },
  { value: 'run', label: 'Lari', sports: ['run'] },
  { value: 'ride', label: 'Sepeda', sports: ['ride'] },
  { value: 'outdoor', label: 'Outdoor', sports: ['walk', 'hike'] },
  { value: 'other', label: 'Lainnya', sports: ['swim', 'gym', 'football', 'yoga'] },
]

export function ActivitiesPage() {
  const activities = useAppStore((state) => state.activities)
  const user = useAppStore((state) => state.user)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const myActivities = activities.filter((activity) => activity.userId === user.id)

  const summary = useMemo(() => {
    return {
      count: myActivities.length,
      distanceKm: myActivities.reduce((sum, activity) => sum + activity.distanceM, 0) / 1000,
      durationS: myActivities.reduce((sum, activity) => sum + activity.durationS, 0),
      elevationM: myActivities.reduce((sum, activity) => sum + activity.elevationM, 0),
      calories: myActivities.reduce((sum, activity) => sum + activity.calories, 0),
    }
  }, [myActivities])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const sportFilter = sportFilters.find((item) => item.value === filter)
    let result = filter === 'mine' ? myActivities : activities

    if (sportFilter?.sports) {
      result = result.filter((activity) => sportFilter.sports?.includes(activity.sport))
    }

    if (normalized) {
      result = result.filter((activity) =>
        [activity.title, activity.location, activity.userName, SPORTS[activity.sport].label]
          .join(' ')
          .toLowerCase()
          .includes(normalized),
      )
    }

    return result
  }, [activities, filter, myActivities, query])

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <TrendingUp className="size-3.5" />
            Jejak perjalananmu
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            Aktivitas
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Semua sesi olahraga, dari lari pagi sampai sesi gym yang singkat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ManualActivityDialog />
          <Button asChild className="gap-1.5">
            <Link to="/record">
              <Plus className="size-4" />
              Rekam baru
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Total aktivitas',
            value: formatNumber(summary.count),
            unit: 'sesi',
            icon: CalendarRange,
            color: '#b6f240',
          },
          {
            label: 'Total jarak',
            value: summary.distanceKm.toFixed(1),
            unit: 'km',
            icon: Footprints,
            color: '#52c7b8',
          },
          {
            label: 'Waktu aktif',
            value: formatDurationShort(summary.durationS),
            unit: '',
            icon: Timer,
            color: '#f2c14e',
          },
          {
            label: 'Total elevasi',
            value: formatNumber(summary.elevationM),
            unit: 'm',
            icon: Mountain,
            color: '#ff7a45',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl border border-border/80 bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                  {stat.label}
                </p>
                <Icon className="size-4" style={{ color: stat.color }} />
              </div>
              <p className="stat-number mt-2.5 font-display text-2xl font-bold">
                {stat.value}
                {stat.unit && (
                  <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                    {stat.unit}
                  </span>
                )}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="border-0 bg-transparent p-0">
            {sportFilters.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari aktivitas..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold text-muted-foreground">
          {filtered.length} aktivitas ditemukan
        </p>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Flame className="size-3.5 text-accent" />
          {formatNumber(summary.calories)} kcal terbakar
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
            <Search className="size-5" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold">Belum ada aktivitas</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Coba ubah filter atau kata kunci. Kamu juga bisa mencatat aktivitas baru secara manual.
          </p>
          <ManualActivityDialog triggerLabel="Catat aktivitas" />
        </div>
      ) : (
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {filtered.map((activity) => (
            <ActivityListCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  )
}
