import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Plus,
  TrendingUp,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { clubs } from '@/data/mock'
import { formatNumber } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const events = [
  {
    id: 'event-weekend',
    title: 'Weekend Run GBK',
    club: 'GBK Runners',
    date: 'Sabtu, 7 November',
    time: '06.00 WIB',
    location: 'Pintu 10 GBK',
    attendees: 48,
    color: '#b6f240',
  },
  {
    id: 'event-night',
    title: 'Night Ride 30K',
    club: 'Jakarta Night Ride',
    date: 'Jumat, 6 November',
    time: '19.30 WIB',
    location: 'Bundaran HI',
    attendees: 32,
    color: '#52c7b8',
  },
  {
    id: 'event-trail',
    title: 'Trail Explore Dago',
    club: 'Trail Seekers ID',
    date: 'Minggu, 8 November',
    time: '05.30 WIB',
    location: 'Dago Pakar',
    attendees: 21,
    color: '#ff9a62',
  },
]

export function ClubsPage() {
  const [city, setCity] = useState('all')
  const [joined, setJoined] = useState<string[]>(['club-gbk'])
  const [attending, setAttending] = useState<string[]>([])

  const visibleClubs = useMemo(
    () => (city === 'all' ? clubs : clubs.filter((club) => club.city === city)),
    [city],
  )

  const featured = clubs[0]
  const clubRanking = [...clubs].sort((a, b) => b.weeklyKm - a.weeklyKm)

  function toggleJoin(clubId: string, name: string) {
    const isJoined = joined.includes(clubId)
    setJoined((current) =>
      isJoined ? current.filter((id) => id !== clubId) : [...current, clubId],
    )
    toast.success(isJoined ? `Kamu keluar dari ${name}` : `Selamat bergabung di ${name}!`)
  }

  function toggleAttend(eventId: string, title: string) {
    const isAttending = attending.includes(eventId)
    setAttending((current) =>
      isAttending ? current.filter((id) => id !== eventId) : [...current, eventId],
    )
    toast.success(isAttending ? `Batal hadir di ${title}` : `Kamu akan hadir di ${title}`)
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <UsersRound className="size-3.5" />
            Bergerak bersama
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            Klub
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Temukan teman latihan, ikut jadwal komunitas, dan jaga semangat bersama.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-fit gap-1.5"
          onClick={() => toast.info('Fitur membuat klub segera hadir')}
        >
          <Plus className="size-4" />
          Buat klub
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <Card className="hero-glow relative overflow-hidden border-primary/20 lg:col-span-8">
          <div className="pointer-events-none absolute -right-10 -top-16 select-none font-display text-[200px] font-bold leading-none text-foreground/[0.025]">
            GR
          </div>
          <CardContent className="relative p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="grid size-12 place-items-center rounded-2xl text-sm font-bold text-[#17200a]"
                style={{ backgroundColor: featured.color }}
              >
                {featured.initials}
              </span>
              <Badge variant="success" className="gap-1">
                <Trophy className="size-3" /> Klub unggulan
              </Badge>
              {joined.includes(featured.id) && (
                <Badge variant="secondary" className="gap-1">
                  <Check className="size-3" /> Diikuti
                </Badge>
              )}
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">{featured.name}</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {featured.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> {featured.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" /> {formatNumber(featured.members)} anggota
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-primary" />{' '}
                {formatNumber(featured.weeklyKm)} km pekan ini
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                variant={joined.includes(featured.id) ? 'outline' : 'default'}
                onClick={() => toggleJoin(featured.id, featured.name)}
                className="gap-1.5"
              >
                {joined.includes(featured.id) ? (
                  <>
                    <Check className="size-4" /> Sudah bergabung
                  </>
                ) : (
                  'Gabung klub'
                )}
              </Button>
              <Button variant="ghost" className="gap-1.5 text-primary">
                Lihat jadwal <ArrowRight className="size-3.5" />
              </Button>
              <div className="ml-auto hidden items-center sm:flex">
                <div className="flex -space-x-2">
                  {['DA', 'BP', 'FH', 'SN'].map((initials, index) => (
                    <span
                      key={initials}
                      className="grid size-7 place-items-center rounded-full border-2 border-card text-[8px] font-bold text-[#17200a]"
                      style={{ backgroundColor: ['#ff9a62', '#52c7b8', '#f2c14e', '#9a8cff'][index] }}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-[10px] text-muted-foreground">+1.280 lainnya</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle>Klasemen klub</CardTitle>
            <Trophy className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1 pt-1">
            {clubRanking.map((club, index) => (
              <div key={club.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                <span
                  className={cn(
                    'w-4 text-center font-display text-[11px] font-bold',
                    index === 0 ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-[9px] font-bold text-[#17200a]"
                  style={{ backgroundColor: club.color }}
                >
                  {club.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold">{club.name}</p>
                  <p className="text-[9px] text-muted-foreground">{formatNumber(club.members)} anggota</p>
                </div>
                <span className="stat-number text-[10px] font-semibold text-muted-foreground">
                  {formatNumber(club.weeklyKm)} km
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Jelajahi klub</h2>
          <p className="mt-1 text-xs text-muted-foreground">Temukan komunitas dengan vibe yang cocok.</p>
        </div>
        <Tabs value={city} onValueChange={setCity}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="Jakarta">Jakarta</TabsTrigger>
            <TabsTrigger value="Bandung">Bandung</TabsTrigger>
            <TabsTrigger value="Surabaya">Surabaya</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visibleClubs.map((club) => {
          const isJoined = joined.includes(club.id)
          return (
            <Card key={club.id} className="overflow-hidden">
              <div
                className="relative h-24 overflow-hidden app-grid"
                style={{
                  background: `radial-gradient(circle at 80% 20%, ${club.color}36, transparent 60%), var(--card)`,
                }}
              >
                <span
                  className="absolute bottom-3 left-4 grid size-12 place-items-center rounded-2xl text-sm font-bold text-[#17200a] shadow-lg"
                  style={{ backgroundColor: club.color }}
                >
                  {club.initials}
                </span>
                <Badge variant="secondary" className="absolute right-3 top-3">
                  {club.city}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-display text-sm font-semibold">{club.name}</h3>
                <p className="mt-1 line-clamp-2 min-h-8 text-[10px] leading-relaxed text-muted-foreground">
                  {club.description}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5">
                  <div>
                    <p className="text-[9px] text-muted-foreground">Anggota</p>
                    <p className="text-[11px] font-semibold">{formatNumber(club.members)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground">Pekan ini</p>
                    <p className="text-[11px] font-semibold">{formatNumber(club.weeklyKm)} km</p>
                  </div>
                </div>
                <Button
                  variant={isJoined ? 'outline' : 'default'}
                  size="sm"
                  className="mt-3 w-full text-[10px]"
                  onClick={() => toggleJoin(club.id, club.name)}
                >
                  {isJoined ? 'Sudah bergabung' : 'Gabung klub'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Agenda komunitas</h2>
            <p className="mt-1 text-xs text-muted-foreground">Latihan bareng terdekat di sekitarmu.</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            Lihat kalender <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {events.map((event) => {
            const isAttending = attending.includes(event.id)
            return (
              <Card key={event.id} style={{ background: `radial-gradient(circle at 100% 0%, ${event.color}12, transparent 50%), var(--card)` }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <span
                      className="grid size-9 place-items-center rounded-xl"
                      style={{ color: event.color, backgroundColor: `${event.color}14` }}
                    >
                      <CalendarDays className="size-4" />
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {event.club}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold">{event.title}</h3>
                  <div className="mt-1.5 space-y-1 text-[10px] text-muted-foreground">
                    <p>{event.date} • {event.time}</p>
                    <p className="flex items-center gap-1">
                      <MapPin className="size-3" /> {event.location}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="size-3" /> {event.attendees} hadir
                    </span>
                    <Button
                      size="sm"
                      variant={isAttending ? 'outline' : 'secondary'}
                      className="h-7 px-2.5 text-[10px]"
                      onClick={() => toggleAttend(event.id, event.title)}
                    >
                      {isAttending ? 'Batal' : 'Hadir'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
