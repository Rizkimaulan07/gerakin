import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bookmark,
  ChevronRight,
  Compass,
  Crown,
  MapPin,
  Mountain,
  Search,
  Star,
  Timer,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { challenges, clubs, leaderboard, popularRoutes } from '@/data/mock'
import { formatNumber, formatPace } from '@/lib/format'
import { useAppStore } from '@/store/use-app-store'
import { UserAvatar } from '@/components/user-avatar'
import { RouteThumbnail } from '@/components/route-thumbnail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type Metric = 'distance' | 'elevation' | 'pace'

const metricLabels: Record<Metric, { label: string; unit: string }> = {
  distance: { label: 'Jarak', unit: 'km' },
  elevation: { label: 'Elevasi', unit: 'm' },
  pace: { label: 'Pace', unit: '/km' },
}

export function ExplorePage() {
  const [metric, setMetric] = useState<Metric>('distance')
  const [query, setQuery] = useState('')
  const [savedRoutes, setSavedRoutes] = useState<string[]>(['route-gbk'])
  const joinedChallenges = useAppStore((state) => state.joinedChallenges)
  const joinChallenge = useAppStore((state) => state.joinChallenge)

  const ranked = useMemo(() => {
    const sorted = [...leaderboard].sort((a, b) => {
      if (metric === 'elevation') return b.elevationM - a.elevationM
      if (metric === 'pace') return a.avgPaceS - b.avgPaceS
      return b.distanceKm - a.distanceKm
    })
    return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }))
  }, [metric])

  const currentEntry = ranked.find((entry) => entry.isCurrentUser)
  const topThree = [ranked[1], ranked[0], ranked[2]].filter(Boolean)

  const filteredRoutes = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return popularRoutes
    return popularRoutes.filter((route) =>
      [route.name, route.location].join(' ').toLowerCase().includes(normalized),
    )
  }, [query])

  function valueFor(entry: (typeof leaderboard)[number]) {
    if (metric === 'elevation') return `${formatNumber(entry.elevationM)} m`
    if (metric === 'pace') return formatPace(entry.avgPaceS)
    return `${entry.distanceKm} km`
  }

  function toggleSaved(routeId: string, name: string) {
    setSavedRoutes((current) => {
      const saved = current.includes(routeId)
      toast.success(saved ? `${name} dihapus dari simpanan` : `${name} disimpan`)
      return saved ? current.filter((id) => id !== routeId) : [...current, routeId]
    })
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <Compass className="size-3.5" />
            Temukan rute baru
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            Jelajah
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Bandingkan performa, temukan rute populer, dan cari komunitas di sekitarmu.
          </p>
        </div>
        <Button variant="outline" className="w-fit gap-1.5">
          <MapPin className="size-4 text-primary" />
          Jakarta
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader className="flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-4 text-primary" />
                Peringkat mingguan
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Diperbarui setiap Senin • {formatNumber(15620)} peserta
              </p>
            </div>
            <Tabs value={metric} onValueChange={(value) => setMetric(value as Metric)}>
              <TabsList>
                <TabsTrigger value="distance">Jarak</TabsTrigger>
                <TabsTrigger value="elevation">Elevasi</TabsTrigger>
                <TabsTrigger value="pace">Pace</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-3 items-end gap-2 rounded-2xl border border-border/70 bg-background/30 p-3">
              {topThree.map((entry) => {
                const isFirst = entry.rank === 1
                return (
                  <div
                    key={entry.rank}
                    className={cn(
                      'relative flex flex-col items-center rounded-xl border px-2 py-3 text-center',
                      isFirst
                        ? 'border-primary/30 bg-primary/[0.07] pb-4'
                        : 'border-transparent bg-secondary/30',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-2 top-2 grid size-5 place-items-center rounded-full text-[9px] font-bold',
                        isFirst
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {entry.rank}
                    </span>
                    {isFirst && <Crown className="mb-1 size-3.5 text-primary" />}
                    <UserAvatar
                      name={entry.name}
                      initials={entry.initials}
                      color={entry.color}
                      size={isFirst ? 'lg' : 'md'}
                      ring={isFirst}
                    />
                    <p className="mt-1.5 w-full truncate text-[11px] font-semibold text-foreground">
                      {entry.isCurrentUser ? 'Kamu' : entry.name.split(' ')[0]}
                    </p>
                    <p className={cn('stat-number text-[10px] font-bold', isFirst ? 'text-primary' : 'text-muted-foreground')}>
                      {valueFor(entry)}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 divide-y divide-border/70">
              {ranked.map((entry) => (
                <div
                  key={entry.name}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-2 py-2.5',
                    entry.isCurrentUser && 'bg-primary/[0.06]',
                  )}
                >
                  <span
                    className={cn(
                      'w-5 text-center font-display text-xs font-bold',
                      entry.rank <= 3 ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {entry.rank}
                  </span>
                  <UserAvatar
                    name={entry.name}
                    initials={entry.initials}
                    color={entry.color}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {entry.isCurrentUser ? 'Kamu (Rizki)' : entry.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.distanceKm} km • {entry.elevationM} m elevasi
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="stat-number text-xs font-bold text-foreground">{valueFor(entry)}</p>
                    <p className="text-[9px] text-muted-foreground">{metricLabels[metric].label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-4">
          <Card className="hero-glow border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Badge variant="success" className="gap-1">
                  <Zap className="size-3" /> Performa kamu
                </Badge>
                <span className="text-[10px] font-semibold text-muted-foreground">Pekan ini</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="font-display text-3xl font-bold">
                    #{currentEntry?.rank ?? '—'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    dari {ranked.length} teman yang diikuti
                  </p>
                </div>
                <div className="text-right">
                  <p className="stat-number font-display text-lg font-semibold text-primary">
                    37,6 km
                  </p>
                  <p className="text-[9px] text-muted-foreground">Total jarak</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-background/40 px-2.5 py-2">
                  <p className="text-[9px] text-muted-foreground">Pace rata-rata</p>
                  <p className="mt-0.5 text-xs font-semibold">5:56 /km</p>
                </div>
                <div className="rounded-lg bg-background/40 px-2.5 py-2">
                  <p className="text-[9px] text-muted-foreground">Elevasi</p>
                  <p className="mt-0.5 text-xs font-semibold">238 m</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Tantangan terbuka</CardTitle>
              <Link to="/challenges" className="text-[10px] font-semibold text-primary">
                Semua
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 pt-1">
              {challenges.slice(1, 4).map((challenge) => {
                const joined = joinedChallenges.includes(challenge.id)
                return (
                  <div key={challenge.id} className="flex items-center gap-2.5 rounded-xl border border-border/60 p-2">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg"
                      style={{ color: challenge.accent, backgroundColor: `${challenge.accent}14` }}
                    >
                      {challenge.metric === 'streak' ? (
                        <Zap className="size-4" />
                      ) : challenge.metric === 'elevation' ? (
                        <Mountain className="size-4" />
                      ) : (
                        <Timer className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-foreground">{challenge.title}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {challenge.daysLeft} hari lagi • {formatNumber(challenge.participants)} peserta
                      </p>
                    </div>
                    <Button
                      variant={joined ? 'ghost' : 'secondary'}
                      size="sm"
                      className="h-6 px-2 text-[9px]"
                      onClick={() => {
                        joinChallenge(challenge.id)
                        toast.success(joined ? 'Keluar dari tantangan' : 'Tantangan diikuti!')
                      }}
                    >
                      {joined ? 'Keluar' : 'Gabung'}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Klub di sekitarmu</CardTitle>
              <Link to="/clubs" className="text-[10px] font-semibold text-primary">
                Semua
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 pt-1">
              {clubs.slice(0, 2).map((club) => (
                <div key={club.id} className="flex items-center gap-2.5">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-[#17200a]"
                    style={{ backgroundColor: club.color }}
                  >
                    {club.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-foreground">{club.name}</p>
                    <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Users className="size-2.5" /> {formatNumber(club.members)} anggota • {club.city}
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Rute populer</h2>
          <p className="mt-1 text-xs text-muted-foreground">Rute favorit komunitas di sekitarmu.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari rute atau kota..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filteredRoutes.map((route) => {
          const saved = savedRoutes.includes(route.id)
          return (
            <div
              key={route.id}
              className="group overflow-hidden rounded-2xl border border-border/80 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="relative">
                <RouteThumbnail route={route.route} sport={route.sport} className="h-32" />
                <button
                  type="button"
                  onClick={() => toggleSaved(route.id, route.name)}
                  aria-label={saved ? `Hapus ${route.name} dari simpanan` : `Simpan ${route.name}`}
                  className={cn(
                    'absolute right-2.5 top-2.5 z-10 grid size-8 cursor-pointer place-items-center rounded-lg border border-white/10 bg-black/40 backdrop-blur-md transition-colors',
                    saved ? 'text-primary' : 'text-white/70 hover:text-white',
                  )}
                >
                  <Bookmark className={cn('size-3.5', saved && 'fill-current')} />
                </button>
              </div>
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-semibold">{route.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="size-3" /> {route.location}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-[#f2c14e]">
                    <Star className="size-3 fill-current" /> {route.rating}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-2.5">
                  <div>
                    <p className="text-[9px] text-muted-foreground">Jarak</p>
                    <p className="stat-number text-[11px] font-semibold">{route.distanceKm} km</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">Elevasi</p>
                    <p className="stat-number text-[11px] font-semibold">{route.elevationM} m</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Komunitas sekitar</h2>
            <p className="mt-1 text-xs text-muted-foreground">Temukan pace dan jadwal yang cocok.</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
            <Link to="/clubs">
              Semua klub <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {clubs.map((club) => (
            <div key={club.id} className="rounded-2xl border border-border/80 bg-card p-4">
              <div className="flex items-start justify-between">
                <span
                  className="grid size-10 place-items-center rounded-xl text-xs font-bold text-[#17200a]"
                  style={{ backgroundColor: club.color }}
                >
                  {club.initials}
                </span>
                <Badge variant="outline">{club.city}</Badge>
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold">{club.name}</h3>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                {club.description}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="size-3" /> {formatNumber(club.members)}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 px-2 text-[9px]"
                  onClick={() => toast.success(`Permintaan gabung ${club.name} dikirim`)}
                >
                  Gabung
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
