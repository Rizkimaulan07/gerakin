import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Flame,
  LocateFixed as Gps,
  Heart,
  HeartPulse,
  MapPin,
  MessageCircle,
  Mountain,
  Share2,
  Sparkles,
  Timer,
  Trophy,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/use-app-store'
import { SPORTS } from '@/lib/sports'
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatNumber,
  formatPace,
  formatRelative,
  formatSpeed,
  paceFromActivity,
  speedFromActivity,
} from '@/lib/format'
import { ActivityMap } from '@/components/activity-map'
import { PaceChart } from '@/components/charts'
import { UserAvatar } from '@/components/user-avatar'
import { SportIcon } from '@/components/sport-icon'
import { RouteThumbnail } from '@/components/route-thumbnail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function buildSplits(distanceM: number, durationS: number) {
  const fullKilometers = Math.floor(distanceM / 1000)
  if (fullKilometers < 1) return []

  const count = Math.min(fullKilometers, 25)
  const averagePace = durationS / (distanceM / 1000)
  const pattern = [-9, 5, -3, 11, -6, 4, 0, 7, -4, 10, -2, 3]

  return Array.from({ length: count }, (_, index) => ({
    km: index + 1,
    pace: Math.max(120, Math.round(averagePace + pattern[index % pattern.length])),
  }))
}

export function ActivityDetailPage() {
  const { activityId } = useParams()
  const navigate = useNavigate()
  const activities = useAppStore((state) => state.activities)
  const user = useAppStore((state) => state.user)
  const kudosGiven = useAppStore((state) => state.kudosGiven)
  const toggleKudos = useAppStore((state) => state.toggleKudos)
  const addComment = useAppStore((state) => state.addComment)
  const [draft, setDraft] = useState('')

  const activity = activities.find((item) => item.id === activityId)
  const isMine = activity?.userId === user.id
  const given = activity ? kudosGiven.includes(activity.id) : false

  const splits = useMemo(
    () => (activity && activity.sport !== 'ride' ? buildSplits(activity.distanceM, activity.durationS) : []),
    [activity],
  )

  if (!activity) {
    return (
      <div className="mx-auto grid max-w-xl place-items-center px-4 py-24 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
          <MapPin className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold">Aktivitas tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aktivitas ini mungkin sudah dihapus atau tautannya tidak valid.
        </p>
        <Button asChild className="mt-5">
          <Link to="/activities">Kembali ke aktivitas</Link>
        </Button>
      </div>
    )
  }

  const meta = SPORTS[activity.sport]
  const isRide = activity.sport === 'ride'
  const pace = paceFromActivity(activity.distanceM, activity.durationS)
  const speed = speedFromActivity(activity.distanceM, activity.durationS)
  const startHour = new Date(activity.date).getHours()

  const fastestSplit = splits.length
    ? splits.reduce((best, split) => (split.pace < best.pace ? split : best), splits[0])
    : null

  const achievements = [
    activity.distanceM >= 10000 && {
      title: 'Long distance',
      description: 'Melewati 10 km dalam satu sesi.',
      icon: Trophy,
      color: '#f2c14e',
    },
    startHour < 7 && {
      title: 'Early bird',
      description: 'Selesai sebelum jam 07.00 pagi.',
      icon: Sparkles,
      color: '#b6f240',
    },
    activity.route.length > 0 && {
      title: 'Rute terekam',
      description: `${activity.route.length} titik GPS tersimpan.`,
      icon: Gps,
      color: '#52c7b8',
    },
  ].filter(Boolean) as Array<{
    title: string
    description: string
    icon: typeof Trophy
    color: string
  }>

  async function shareActivity() {
    const url = `${window.location.origin}${window.location.pathname}#/activities/${activity?.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Tautan aktivitas disalin')
    } catch {
      toast.error('Tidak bisa menyalin tautan')
    }
  }

  function submitComment(event: FormEvent) {
    event.preventDefault()
    if (!activity || !draft.trim()) return
    addComment(activity.id, draft)
    setDraft('')
    toast.success('Komentar ditambahkan')
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Kembali
      </button>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <Link to={isMine ? '/profile' : '/feed'} aria-label="Lihat profil">
            <UserAvatar
              name={activity.userName}
              initials={activity.userInitials}
              color={activity.userColor}
              size="lg"
            />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{activity.userName}</p>
              {isMine && <Badge variant="muted">Aktivitasmu</Badge>}
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="size-3" />
                {formatDate(activity.date)}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              {activity.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {activity.location}
              </span>
              <span>•</span>
              <span style={{ color: meta.color }}>{meta.label}</span>
              <span>•</span>
              <span>{activity.route.length > 0 ? 'Rute GPS' : 'Tanpa rute'}</span>
            </div>
            {activity.description && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {activity.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={given ? 'default' : 'outline'}
            onClick={() => toggleKudos(activity.id)}
            className="gap-1.5"
          >
            <Heart className={cn('size-4', given && 'fill-current')} />
            {activity.kudos}
            <span className="hidden sm:inline">Kudos</span>
          </Button>
          <Button variant="outline" onClick={shareActivity} className="gap-1.5">
            <Share2 className="size-4" />
            <span className="hidden sm:inline">Bagikan</span>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {activity.route.length > 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/80">
              <ActivityMap route={activity.route} className="h-[300px] sm:h-[420px]" />
              <div className="pointer-events-none absolute left-3 top-3 z-[400] flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] font-semibold text-white/80 backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-primary" />
                Rute aktivitas
              </div>
              <div className="pointer-events-none absolute bottom-3 right-3 z-[400] rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] font-semibold text-white/70 backdrop-blur-md">
                {formatDistance(activity.distanceM)} • {formatDuration(activity.durationS)}
              </div>
            </div>
          ) : (
            <div className="relative flex h-[260px] items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-card app-grid">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(182,242,64,0.12),transparent_55%)]" />
              <div className="relative text-center">
                <SportIcon sport={activity.sport} size="lg" className="mx-auto" />
                <p className="mt-3 font-display text-lg font-semibold">Aktivitas tanpa rute GPS</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dicatat secara manual • {meta.label}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Jarak', value: formatDistance(activity.distanceM), icon: MapPin, color: '#b6f240' },
              { label: 'Waktu', value: formatDuration(activity.durationS), icon: Timer, color: '#52c7b8' },
              {
                label: isRide ? 'Kecepatan' : 'Pace',
                value: isRide ? formatSpeed(speed) : formatPace(pace),
                icon: Flame,
                color: '#ff7a45',
              },
              {
                label: 'Elevasi',
                value: `${activity.elevationM} m`,
                icon: Mountain,
                color: '#f2c14e',
              },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl border border-border/80 bg-card p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <Icon className="size-3.5" style={{ color: stat.color }} />
                  </div>
                  <p className="stat-number mt-2 font-display text-lg font-bold">{stat.value}</p>
                </div>
              )
            })}
          </div>

          {splits.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle>Pace per km</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Konsistensi ritme sepanjang aktivitas
                  </p>
                </div>
                {fastestSplit && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="size-3" />
                    Tercepat km {fastestSplit.km}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[220px]">
                  <PaceChart splits={splits} />
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-3 text-[10px] text-muted-foreground">
                  <span>Makin tinggi batang = makin cepat</span>
                  <span>
                    Rata-rata{' '}
                    <span className="font-semibold text-foreground">{formatPace(pace)}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Komentar ({activity.comments.length})</CardTitle>
              <MessageCircle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1">
              <div className="space-y-3">
                {activity.comments.length === 0 && (
                  <p className="rounded-xl bg-secondary/40 py-6 text-center text-xs text-muted-foreground">
                    Belum ada komentar. Beri semangat untuk sesi ini!
                  </p>
                )}
                {activity.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <UserAvatar
                      name={comment.name}
                      initials={comment.initials}
                      color={comment.color}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="rounded-xl rounded-tl-sm bg-secondary/60 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold text-foreground">{comment.name}</p>
                          <span className="shrink-0 text-[9px] text-muted-foreground">
                            {formatRelative(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={submitComment} className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Komentar sebagai ${user.name.split(' ')[0]}...`}
                  className="h-9 text-xs"
                />
                <Button type="submit" disabled={!draft.trim()} size="sm" className="gap-1.5">
                  Kirim
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/30 p-3">
                <SportIcon sport={activity.sport} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">{meta.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {activity.route.length > 0 ? 'Terekam dengan GPS' : 'Input manual'}
                  </p>
                </div>
                <Badge variant="outline">{activity.route.length > 0 ? 'GPS' : 'Manual'}</Badge>
              </div>

              <dl className="mt-3 space-y-3">
                {[
                  {
                    icon: Flame,
                    label: 'Kalori',
                    value: `${formatNumber(activity.calories)} kcal`,
                  },
                  {
                    icon: Mountain,
                    label: 'Elevasi',
                    value: `${activity.elevationM} m`,
                  },
                  ...(activity.avgHeartRate
                    ? [
                        {
                          icon: HeartPulse,
                          label: 'Detak jantung',
                          value: `${activity.avgHeartRate} bpm`,
                        },
                      ]
                    : []),
                  {
                    icon: MapPin,
                    label: 'Lokasi',
                    value: activity.location,
                  },
                  {
                    icon: Timer,
                    label: 'Waktu mulai',
                    value: formatDate(activity.date),
                  },
                ].map((row) => {
                  const Icon = row.icon
                  return (
                    <div key={row.label} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <dt className="text-[10px] font-medium text-muted-foreground">{row.label}</dt>
                        <dd className="mt-0.5 text-xs font-semibold text-foreground">{row.value}</dd>
                      </div>
                    </div>
                  )
                })}
              </dl>

              <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.06] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  Kudos
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {activity.kudos} orang memberi semangat
                  </p>
                  <div className="flex -space-x-1.5">
                    {['DA', 'BP', 'FH'].map((initials, index) => (
                      <span
                        key={initials}
                        className="grid size-5 place-items-center rounded-full border-2 border-card text-[7px] font-bold text-[#17200a]"
                        style={{ backgroundColor: ['#ff9a62', '#52c7b8', '#f2c14e'][index] }}
                      >
                        {initials}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Pencapaian sesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-1">
              {achievements.map((achievement) => {
                const Icon = achievement.icon
                return (
                  <div key={achievement.title} className="flex items-center gap-2.5">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg"
                      style={{ color: achievement.color, backgroundColor: `${achievement.color}14` }}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{achievement.title}</p>
                      <p className="text-[10px] text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                )
              })}
              {achievements.length === 0 && (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  Terus bergerak untuk membuka pencapaian baru.
                </p>
              )}
            </CardContent>
          </Card>

          {isMine && (
            <Card className="overflow-hidden">
              <RouteThumbnail
                route={activity.route}
                sport={activity.sport}
                className="h-28"
                showGrid={false}
              />
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Sesi berikutnya
                </p>
                <p className="mt-1.5 font-display text-lg font-semibold">Jaga momentummu</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Rekam sesi berikutnya dan lihat progresmu bertambah.
                </p>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link to="/record">Mulai aktivitas</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
