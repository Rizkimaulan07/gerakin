import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Flame,
  Footprints,
  Mountain,
  Play,
  Route as RouteIcon,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { challenges, weeklyPoints } from '@/data/mock'
import { formatDurationShort, formatRelative } from '@/lib/format'
import { useAppStore } from '@/store/use-app-store'
import { ManualActivityDialog } from '@/components/manual-activity-dialog'
import { GoalRing } from '@/components/goal-ring'
import { WeeklyChart } from '@/components/charts'
import { ActivityMiniCard } from '@/components/activity-cards'
import { UserAvatar } from '@/components/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

function todayLabel() {
  const label = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  return label.charAt(0).toUpperCase() + label.slice(1)
}

interface StatCardProps {
  label: string
  value: string
  unit: string
  hint: string
  icon: typeof Timer
  accent: string
}

function StatCard({ label, value, unit, hint, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span
          className="grid size-7 place-items-center rounded-lg"
          style={{ color: accent, backgroundColor: `${accent}14` }}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="stat-number mt-3 font-display text-2xl font-bold tracking-tight">
        {value}
        <span className="ml-1 text-xs font-medium tracking-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-1 text-[10px] font-medium text-muted-foreground">{hint}</p>
    </div>
  )
}

const personalRecords = [
  { distance: '1 km', time: '5:12', trend: 'PR terbaru' },
  { distance: '5 km', time: '28:42', trend: 'Apr 2026' },
  { distance: '10 km', time: '59:18', trend: 'Feb 2026' },
  { distance: 'Terjauh', time: '15,2 km', trend: 'Minggu lalu' },
]

export function DashboardPage() {
  const user = useAppStore((state) => state.user)
  const activities = useAppStore((state) => state.activities)
  const joinedChallenges = useAppStore((state) => state.joinedChallenges)

  const summary = useMemo(() => {
    const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000
    const weekActivities = activities.filter(
      (activity) =>
        activity.userId === user.id && new Date(activity.date).getTime() >= weekStart,
    )

    return {
      distanceKm: weekActivities.reduce((sum, activity) => sum + activity.distanceM, 0) / 1000,
      durationS: weekActivities.reduce((sum, activity) => sum + activity.durationS, 0),
      elevationM: weekActivities.reduce((sum, activity) => sum + activity.elevationM, 0),
      calories: weekActivities.reduce((sum, activity) => sum + activity.calories, 0),
      count: weekActivities.length,
    }
  }, [activities, user.id])

  const myActivities = activities.filter((activity) => activity.userId === user.id).slice(0, 4)
  const friendActivities = activities
    .filter((activity) => activity.userId !== user.id)
    .slice(0, 3)
  const activeChallenge =
    challenges.find(
      (challenge) =>
        challenge.id === 'challenge-100k' && joinedChallenges.includes(challenge.id),
    ) ?? challenges[0]
  const challengeProgress = Math.min(
    100,
    Math.round((summary.distanceKm / activeChallenge.target) * 100),
  )

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {todayLabel()}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            {greeting()}, {user.name.split(' ')[0]}
            <span className="ml-2 inline-block origin-bottom-right animate-[wave_1.8s_ease-in-out_infinite]">👋</span>
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {summary.distanceKm >= user.weeklyGoalKm * 0.7
              ? 'Tinggal sedikit lagi menuju target. Jaga ritme, jangan lupa recovery.'
              : 'Mulai dari langkah kecil hari ini. Konsistensi mengalahkan intensitas.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ManualActivityDialog triggerLabel="Catat manual" variant="secondary" />
          <Button asChild size="lg" className="gap-2">
            <Link to="/record">
              <span className="grid size-5 place-items-center rounded-full bg-primary-foreground/15">
                <Play className="size-3 fill-current" />
              </span>
              Mulai olahraga
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <Card className="hero-glow relative overflow-hidden border-primary/20 lg:col-span-8">
          <div className="pointer-events-none absolute -right-10 -top-12 select-none font-display text-[170px] font-bold leading-none tracking-tighter text-foreground/[0.025]">
            RUN
          </div>
          <div className="relative flex flex-col items-center gap-6 p-5 sm:flex-row sm:p-6">
            <div className="min-w-0 flex-1">
              <Badge variant="success" className="gap-1.5">
                <TrendingUp className="size-3" />
                Minggu ini
              </Badge>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                {summary.distanceKm.toFixed(1)} km dari {user.weeklyGoalKm} km
              </h2>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                {summary.distanceKm >= user.weeklyGoalKm
                  ? 'Target tercapai. Luar biasa! Waktunya apresiasi diri.'
                  : `Kamu butuh ${Math.max(0, user.weeklyGoalKm - summary.distanceKm).toFixed(1)} km lagi. Satu sesi santai bisa menyelesaikannya.`}
              </p>

              <div className="mt-5 grid grid-cols-3 divide-x divide-border/70 rounded-xl border border-border/70 bg-background/40">
                <div className="px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Aktivitas
                  </p>
                  <p className="stat-number mt-0.5 font-display text-lg font-semibold">
                    {summary.count}
                    <span className="ml-1 text-[10px] font-medium text-muted-foreground">sesi</span>
                  </p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Waktu
                  </p>
                  <p className="stat-number mt-0.5 font-display text-lg font-semibold">
                    {formatDurationShort(summary.durationS)}
                  </p>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Elevasi
                  </p>
                  <p className="stat-number mt-0.5 font-display text-lg font-semibold">
                    {summary.elevationM}
                    <span className="ml-1 text-[10px] font-medium text-muted-foreground">m</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link to="/activities">
                    Lihat aktivitas <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  {summary.count} sesi dalam 7 hari terakhir
                </span>
              </div>
            </div>

            <GoalRing
              value={Number(summary.distanceKm.toFixed(1))}
              goal={user.weeklyGoalKm}
              className="size-40 shrink-0 sm:size-44"
            />
          </div>
        </Card>

        <Card
          className="relative overflow-hidden lg:col-span-4"
          style={{
            background: `radial-gradient(circle at 100% 0%, ${activeChallenge.accent}22, transparent 55%), var(--card)`,
          }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="gap-1">
                <Trophy className="size-3" /> Tantangan aktif
              </Badge>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {activeChallenge.daysLeft} hari lagi
              </span>
            </div>
            <CardTitle className="pt-2 text-xl">{activeChallenge.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {activeChallenge.description}
            </p>
            <div className="mt-4">
              <div className="mb-1.5 flex items-end justify-between">
                <span className="stat-number font-display text-2xl font-bold">
                  {summary.distanceKm.toFixed(1)}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">
                    / {activeChallenge.target} km
                  </span>
                </span>
                <span className="text-[11px] font-bold" style={{ color: activeChallenge.accent }}>
                  {challengeProgress}%
                </span>
              </div>
              <Progress
                value={challengeProgress}
                indicatorClassName=""
                className="h-2 bg-secondary"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Users className="size-3" />
                {activeChallenge.participants.toLocaleString('id-ID')} peserta
              </span>
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-primary">
                <Link to="/challenges">
                  Detail <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Jarak 7 hari"
          value={summary.distanceKm.toFixed(1)}
          unit="km"
          hint="+12% dari minggu lalu"
          icon={RouteIcon}
          accent="#b6f240"
        />
        <StatCard
          label="Waktu aktif"
          value={formatDurationShort(summary.durationS).replace(' mnt', '').replace(' j', 'j')}
          unit=""
          hint={`${summary.count} sesi tercatat`}
          icon={Timer}
          accent="#52c7b8"
        />
        <StatCard
          label="Elevasi"
          value={String(summary.elevationM)}
          unit="m"
          hint="Total tanjakan"
          icon={Mountain}
          accent="#ff7a45"
        />
        <StatCard
          label="Kalori"
          value={summary.calories.toLocaleString('id-ID')}
          unit="kcal"
          hint="Estimasi terbakar"
          icon={Flame}
          accent="#f2c14e"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader className="flex-row items-start justify-between pb-2">
            <div>
              <CardTitle>Volume latihan</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Jarak harian dalam 7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground sm:block">
                7 hari
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                {summary.distanceKm.toFixed(1)} km
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="h-[220px]">
              <WeeklyChart data={weeklyPoints} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Footprints className="size-3.5 text-primary" />
                Rata-rata {((summary.durationS / 60) / Math.max(1, summary.distanceKm)).toFixed(1)} menit/km
              </p>
              <p className="text-[11px] text-muted-foreground">
                Hari terbaik: <span className="font-semibold text-foreground">Sabtu</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle>Rekor pribadi</CardTitle>
            <Trophy className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="divide-y divide-border/70">
              {personalRecords.map((record) => (
                <div key={record.distance} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{record.distance}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{record.trend}</p>
                  </div>
                  <span className="stat-number font-display text-sm font-semibold text-primary">
                    {record.time}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-primary/15 bg-primary/[0.06] p-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Target className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-foreground">10K di bawah 55 menit</p>
                  <p className="text-[10px] text-muted-foreground">Target berikutnya • 4:18 lebih cepat</p>
                </div>
              </div>
              <Progress value={72} className="mt-2.5 h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Aktivitas terakhir</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Perjalananmu sejauh ini</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-primary">
              <Link to="/activities">
                Semua <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="space-y-1">
              {myActivities.map((activity) => (
                <ActivityMiniCard key={activity.id} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Dari komunitas</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Temanmu sedang bergerak</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-primary">
              <Link to="/feed">
                Feed <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {friendActivities.map((activity) => (
              <Link
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="group flex items-start gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-secondary/60"
              >
                <UserAvatar
                  name={activity.userName}
                  initials={activity.userInitials}
                  color={activity.userColor}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">{activity.userName}</span>{' '}
                    menyelesaikan{' '}
                    <span className="font-semibold text-foreground">
                      {(activity.distanceM / 1000).toFixed(1)} km
                    </span>{' '}
                    {activity.sport === 'ride'
                      ? 'bersepeda'
                      : activity.sport === 'run'
                        ? 'lari'
                        : activity.sport === 'hike'
                          ? 'hiking'
                          : 'jalan kaki'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatRelative(activity.date)}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
            <div className="rounded-xl border border-border/70 bg-background/30 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <Users className="size-3" /> Klub pilihan
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">GBK Runners</p>
                  <p className="text-[10px] text-muted-foreground">1.284 anggota • Jakarta</p>
                </div>
                <Button asChild variant="outline" size="sm" className="h-7 px-2.5 text-[10px]">
                  <Link to="/clubs">Gabung</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
