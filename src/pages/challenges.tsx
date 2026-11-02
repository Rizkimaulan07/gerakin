import { useState } from 'react'
import {
  CalendarDays,
  Check,
  Flame,
  Lock,
  Medal,
  Mountain,
  Plus,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { badges, challenges as seedChallenges } from '@/data/mock'
import { formatNumber } from '@/lib/format'
import { useAppStore } from '@/store/use-app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const challengeIcons = {
  distance: Target,
  elevation: Mountain,
  streak: Flame,
}

const badgeIcons = {
  zap: Zap,
  flame: Flame,
  trophy: Trophy,
  mountain: Mountain,
  medal: Medal,
  target: Target,
}

const trainingPlans = [
  {
    title: '5K Pemula',
    weeks: 4,
    sessions: '3 sesi / minggu',
    description: 'Campuran jalan dan lari untuk membangun kebiasaan tanpa cedera.',
    progress: 50,
    color: '#b6f240',
  },
  {
    title: '10K Impian',
    weeks: 8,
    sessions: '4 sesi / minggu',
    description: 'Tingkatkan volume perlahan sampai nyaman menyelesaikan 10 km.',
    progress: 0,
    color: '#52c7b8',
  },
  {
    title: 'Half Marathon',
    weeks: 12,
    sessions: '4–5 sesi / minggu',
    description: 'Program long run terstruktur untuk menaklukkan 21,1 km.',
    progress: 0,
    color: '#ff9a62',
  },
]

function progressFor(challengeId: string) {
  const progress: Record<string, number> = {
    'challenge-100k': 37.6,
    'challenge-streak': 5,
    'challenge-elevation': 238,
    'challenge-ride': 0,
    'challenge-morning': 8.4,
  }
  return progress[challengeId] ?? 0
}

export function ChallengesPage() {
  const joinedChallenges = useAppStore((state) => state.joinedChallenges)
  const joinChallenge = useAppStore((state) => state.joinChallenge)
  const [filter, setFilter] = useState('all')

  const featured = seedChallenges[0]
  const visibleChallenges = seedChallenges.filter((challenge) => {
    if (filter === 'joined') return joinedChallenges.includes(challenge.id)
    if (filter === 'ending') return challenge.daysLeft <= 12
    return true
  })
  const featuredProgress = Math.min(100, (progressFor(featured.id) / featured.target) * 100)

  function toggleChallenge(challengeId: string, title: string) {
    const joined = joinedChallenges.includes(challengeId)
    joinChallenge(challengeId)
    toast.success(joined ? `Keluar dari ${title}` : `Kamu bergabung ke ${title}`)
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <Trophy className="size-3.5" />
            Naik level
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            Tantangan
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Pilih tantangan yang menantang, tapi tetap menyenangkan. Setiap langkah dihitung.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-fit gap-1.5"
          onClick={() => toast.info('Fitur membuat tantangan segera hadir')}
        >
          <Plus className="size-4" />
          Buat tantangan
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Tantangan diikuti', value: String(joinedChallenges.length), icon: Trophy, color: '#b6f240' },
          { label: 'Badge terbuka', value: String(badges.filter((badge) => badge.unlocked).length), icon: Medal, color: '#f2c14e' },
          { label: 'Streak terbaik', value: '12 hari', icon: Flame, color: '#ff7a45' },
          { label: 'Peringkat bulanan', value: '#284', icon: Zap, color: '#52c7b8' },
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
              <p className="stat-number mt-2.5 font-display text-2xl font-bold">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <Card
        className="hero-glow relative mt-4 overflow-hidden border-primary/20"
        style={{
          background: `radial-gradient(circle at 90% 20%, ${featured.accent}24, transparent 48%), var(--card)`,
        }}
      >
        <div className="pointer-events-none absolute -bottom-8 right-4 select-none font-display text-[120px] font-bold text-foreground/[0.025]">
          100K
        </div>
        <CardContent className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1">
                <Flame className="size-3" /> Unggulan
              </Badge>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                <Users className="size-3" />
                {formatNumber(featured.participants)} peserta
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                <CalendarDays className="size-3" />
                {featured.daysLeft} hari lagi
              </span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {featured.description}
            </p>
            <div className="mt-4 max-w-lg">
              <div className="mb-1.5 flex items-end justify-between">
                <span className="stat-number font-display text-2xl font-bold">
                  {progressFor(featured.id)}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">
                    / {featured.target} km
                  </span>
                </span>
                <span className="text-[11px] font-bold text-primary">{Math.round(featuredProgress)}%</span>
              </div>
              <Progress value={featuredProgress} className="h-2" />
              <p className="mt-2 text-[10px] text-muted-foreground">
                Hadiah: {featured.reward} • Butuh {Math.max(0, featured.target - progressFor(featured.id))} km lagi
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant={joinedChallenges.includes(featured.id) ? 'outline' : 'default'}
                onClick={() => toggleChallenge(featured.id, featured.title)}
                className="gap-1.5"
              >
                {joinedChallenges.includes(featured.id) ? (
                  <>
                    <Check className="size-4" /> Sudah diikuti
                  </>
                ) : (
                  'Gabung tantangan'
                )}
              </Button>
              <span className="text-[10px] text-muted-foreground">
                Gratis untuk semua pengguna
              </span>
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-2">
            {[
              ['37,6', 'km terkumpul'],
              ['5', 'hari aktif'],
              ['#284', 'peringkat'],
              ['4', 'badge terkait'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-border/70 bg-background/40 px-3 py-2.5 text-center">
                <p className="stat-number font-display text-lg font-bold">{value}</p>
                <p className="text-[9px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Tantangan lainnya</h2>
          <p className="mt-1 text-xs text-muted-foreground">Pilih sesuai target dan waktu luangmu.</p>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="joined">Diikuti</TabsTrigger>
            <TabsTrigger value="ending">Segera berakhir</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleChallenges.map((challenge) => {
          const joined = joinedChallenges.includes(challenge.id)
          const Icon = challengeIcons[challenge.metric]
          const current = progressFor(challenge.id)
          const percentage = Math.min(100, (current / challenge.target) * 100)

          return (
            <Card
              key={challenge.id}
              className="transition-all hover:-translate-y-0.5 hover:border-primary/25"
              style={{
                background: `radial-gradient(circle at 100% 0%, ${challenge.accent}14, transparent 48%), var(--card)`,
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <span
                    className="grid size-10 place-items-center rounded-xl"
                    style={{ color: challenge.accent, backgroundColor: `${challenge.accent}15` }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    {joined && <Badge variant="success">Diikuti</Badge>}
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {challenge.daysLeft} hari
                    </span>
                  </div>
                </div>
                <CardTitle className="pt-2 text-base">{challenge.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">
                  {challenge.description}
                </p>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      {joined ? `${current} / ${challenge.target} ${challenge.unit}` : `Target ${challenge.target} ${challenge.unit}`}
                    </span>
                    <span className="font-semibold" style={{ color: challenge.accent }}>
                      {joined ? `${Math.round(percentage)}%` : `${formatNumber(challenge.participants)} peserta`}
                    </span>
                  </div>
                  <Progress
                    value={joined ? percentage : 0}
                    className="h-1.5"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Trophy className="size-2.5" /> {challenge.reward}
                  </span>
                  <Button
                    variant={joined ? 'ghost' : 'secondary'}
                    size="sm"
                    className="h-7 px-2.5 text-[10px]"
                    onClick={() => toggleChallenge(challenge.id, challenge.title)}
                  >
                    {joined ? 'Keluar' : 'Gabung'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Koleksi badge</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {badges.filter((badge) => badge.unlocked).length} dari {badges.length} terbuka
              </p>
            </div>
            <Medal className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 pt-2 sm:grid-cols-6">
            {badges.map((badge) => {
              const Icon = badgeIcons[badge.icon]
              return (
                <div
                  key={badge.id}
                  title={badge.description}
                  className={cn(
                    'flex flex-col items-center rounded-xl border px-2 py-3 text-center',
                    badge.unlocked
                      ? 'border-primary/20 bg-primary/[0.05]'
                      : 'border-border/70 bg-secondary/25 opacity-55',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-9 place-items-center rounded-full',
                      badge.unlocked ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {badge.unlocked ? <Icon className="size-4" /> : <Lock className="size-4" />}
                  </span>
                  <p className="mt-2 line-clamp-2 text-[9px] font-semibold leading-tight text-foreground">
                    {badge.name}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle>Rencana latihan</CardTitle>
            <p className="text-xs text-muted-foreground">Program terstruktur untuk target berikutnya</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            {trainingPlans.map((plan) => (
              <div key={plan.title} className="rounded-xl border border-border/70 p-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-[9px] font-bold"
                    style={{ color: plan.color, backgroundColor: `${plan.color}14` }}
                  >
                    {plan.weeks}w
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-foreground">{plan.title}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {plan.weeks} minggu • {plan.sessions}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[9px] text-primary"
                    onClick={() => toast.success(`Program ${plan.title} ditambahkan ke rencanamu`)}
                  >
                    {plan.progress > 0 ? 'Lanjut' : 'Mulai'}
                  </Button>
                </div>
                {plan.progress > 0 && <Progress value={plan.progress} className="mt-2 h-1" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
