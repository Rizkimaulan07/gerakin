import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { SPORTS } from '@/lib/sports'
import { formatDate, formatDistance } from '@/lib/format'
import { useAppStore } from '@/store/use-app-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SportIcon } from '@/components/sport-icon'

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const activities = useAppStore((state) => state.activities)

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const filtered = normalized
      ? activities.filter((activity) => {
          const sportLabel = SPORTS[activity.sport].label.toLowerCase()
          return [activity.title, activity.location, activity.userName, sportLabel]
            .join(' ')
            .toLowerCase()
            .includes(normalized)
        })
      : activities

    return filtered.slice(0, 6)
  }, [activities, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Cari aktivitas</DialogTitle>
          <DialogDescription>Cari berdasarkan judul, lokasi, atau jenis olahraga.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari aktivitas, lokasi, atau teman..."
            className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
          />
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2">
          <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {query ? `${results.length} hasil` : 'Aktivitas terbaru'}
          </p>
          {results.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Tidak ada aktivitas yang cocok.
            </p>
          )}
          {results.map((activity) => (
            <Link
              key={activity.id}
              to={`/activities/${activity.id}`}
              onClick={() => onOpenChange(false)}
              className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary"
            >
              <SportIcon sport={activity.sport} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{activity.title}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {activity.userName} • {formatDate(activity.date)} • {formatDistance(activity.distanceM)}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[10px] text-muted-foreground">
          <span>Tekan Enter untuk membuka hasil</span>
          <span className="font-semibold">Gerakin Search</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
