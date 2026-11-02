import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Flame,
  Globe2,
  Lock,
  MapPin,
  Medal,
  Moon,
  Mountain,
  Pencil,
  Ruler,
  ShieldCheck,
  Sun,
  Target,
  Timer,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { badges } from '@/data/mock'
import { formatDurationShort, formatNumber } from '@/lib/format'
import { useAppStore } from '@/store/use-app-store'
import { ActivityMiniCard } from '@/components/activity-cards'
import { UserAvatar } from '@/components/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const badgeIcons = {
  zap: Zap,
  flame: Flame,
  trophy: Trophy,
  mountain: Mountain,
  medal: Medal,
  target: Target,
}

const personalRecords = [
  { label: '1 km', value: '5:12', note: 'Pace tercepat' },
  { label: '5 km', value: '28:42', note: 'April 2026' },
  { label: '10 km', value: '59:18', note: 'Februari 2026' },
  { label: 'Jarak terjauh', value: '15,2 km', note: 'Minggu lalu' },
]

function EditProfileDialog() {
  const user = useAppStore((state) => state.user)
  const updateProfile = useAppStore((state) => state.updateProfile)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [city, setCity] = useState(user.city)
  const [goal, setGoal] = useState(String(user.weeklyGoalKm))

  useEffect(() => {
    if (!open) return
    setName(user.name)
    setBio(user.bio)
    setCity(user.city)
    setGoal(String(user.weeklyGoalKm))
  }, [open, user])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }

    updateProfile({
      name: name.trim(),
      bio: bio.trim(),
      city: city.trim(),
      weeklyGoalKm: Math.max(1, Number(goal) || 1),
    })
    toast.success('Profil diperbarui')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <Pencil className="size-4" />
          Edit profil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profil</DialogTitle>
          <DialogDescription>
            Perbarui data profil dan target mingguanmu. Perubahan tersimpan di perangkat ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nama lengkap</Label>
            <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Ceritakan olahraga favoritmu..."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-city">Kota</Label>
              <Input id="profile-city" value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-goal">Target mingguan (km)</Label>
              <Input
                id="profile-goal"
                type="number"
                min="1"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan perubahan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SettingRow({
  icon: Icon,
  title,
  description,
  checked,
  onToggle,
  disabled,
}: {
  icon: typeof Bell
  title: string
  description: string
  checked: boolean
  onToggle?: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          'relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-secondary',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4 rounded-full bg-background shadow-sm transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

export function ProfilePage() {
  const user = useAppStore((state) => state.user)
  const activities = useAppStore((state) => state.activities)
  const following = useAppStore((state) => state.following)
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const [notifications, setNotifications] = useState(true)
  const [publicProfile, setPublicProfile] = useState(true)

  const myActivities = useMemo(
    () =>
      activities
        .filter((activity) => activity.userId === user.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [activities, user.id],
  )

  const summary = useMemo(() => {
    return {
      distanceKm: myActivities.reduce((sum, activity) => sum + activity.distanceM, 0) / 1000,
      durationS: myActivities.reduce((sum, activity) => sum + activity.durationS, 0),
      elevationM: myActivities.reduce((sum, activity) => sum + activity.elevationM, 0),
      calories: myActivities.reduce((sum, activity) => sum + activity.calories, 0),
    }
  }, [myActivities])

  const weeklyActivities = myActivities.filter(
    (activity) => new Date(activity.date).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000,
  )
  const weeklyKm = weeklyActivities.reduce((sum, activity) => sum + activity.distanceM, 0) / 1000
  const weeklyPercentage = Math.min(100, (weeklyKm / user.weeklyGoalKm) * 100)
  const unlockedBadges = badges.filter((badge) => badge.unlocked)

  const joinedLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(user.joinedAt))

  async function shareProfile() {
    const url = `${window.location.origin}${window.location.pathname}#/profile`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Tautan profil disalin')
    } catch {
      toast.error('Tidak bisa menyalin tautan')
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div
          className="hero-glow relative h-36 overflow-hidden app-grid sm:h-48"
          style={{
            background:
              'radial-gradient(circle at 15% 20%, rgba(182,242,64,0.2), transparent 42%), radial-gradient(circle at 90% 80%, rgba(255,122,69,0.15), transparent 40%), var(--card)',
          }}
        >
          <div className="pointer-events-none absolute -right-2 -top-12 select-none font-display text-[190px] font-bold leading-none tracking-tighter text-foreground/[0.035]">
            {user.initials}
          </div>
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground backdrop-blur-md">
            <MapPin className="size-3 text-primary" /> {user.city}
          </div>
        </div>

        <div className="relative z-10 px-5 pb-5 sm:px-6">
          <div className="-mt-10 flex flex-col gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-3">
              <UserAvatar
                name={user.name}
                initials={user.initials}
                color={user.color}
                size="xl"
                ring
                className="border-4 border-card shadow-2xl"
              />
              <div className="pb-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {user.name}
                  </h1>
                  <span className="grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5" />
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Button variant="ghost" size="sm" onClick={shareProfile} className="gap-1.5">
                <Copy className="size-3.5" />
                Bagikan
              </Button>
              <EditProfileDialog />
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{user.bio}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              Bergabung sejak {joinedLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> <strong className="text-foreground">{user.followers}</strong>{' '}
              pengikut
            </span>
            <span className="flex items-center gap-1.5">
              <UserPlus className="size-3.5" /> <strong className="text-foreground">{following.length}</strong>{' '}
              mengikuti
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy className="size-3.5 text-primary" /> {unlockedBadges.length} badge
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total jarak', value: summary.distanceKm.toFixed(1), unit: 'km', icon: MapPin, color: '#b6f240' },
          { label: 'Total waktu', value: formatDurationShort(summary.durationS), unit: '', icon: Timer, color: '#52c7b8' },
          { label: 'Total elevasi', value: formatNumber(summary.elevationM), unit: 'm', icon: Mountain, color: '#ff7a45' },
          { label: 'Kalori terbakar', value: formatNumber(summary.calories), unit: 'kcal', icon: Flame, color: '#f2c14e' },
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
                  <span className="ml-1 text-[11px] font-medium text-muted-foreground">{stat.unit}</span>
                )}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Aktivitas terbaru</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{myActivities.length} sesi tercatat</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-primary">
                <Link to="/activities">
                  Semua <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 pt-1">
              {myActivities.slice(0, 4).map((activity) => (
                <ActivityMiniCard key={activity.id} activity={activity} />
              ))}
              {myActivities.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada aktivitas. Mulai rekam sesi pertamamu!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Pencapaian</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {unlockedBadges.length} dari {badges.length} badge terbuka
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-primary">
                <Link to="/challenges">
                  Tantangan <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 pt-2 sm:grid-cols-6">
              {badges.map((badge) => {
                const Icon = badgeIcons[badge.icon]
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      'flex flex-col items-center rounded-xl border px-2 py-3 text-center transition-colors',
                      badge.unlocked
                        ? 'border-primary/20 bg-primary/[0.05]'
                        : 'border-border/70 bg-secondary/25 opacity-55',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-10 place-items-center rounded-full',
                        badge.unlocked ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {badge.unlocked ? <Icon className="size-4.5" /> : <Lock className="size-4" />}
                    </span>
                    <p className="mt-2 line-clamp-2 text-[9px] font-semibold leading-tight text-foreground">
                      {badge.name}
                    </p>
                    <p className="mt-0.5 text-[8px] text-muted-foreground">
                      {badge.unlocked ? 'Terbuka' : 'Terkunci'}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Card className="hero-glow border-primary/20">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Target mingguan</CardTitle>
              <Badge variant="success">{Math.round(weeklyPercentage)}%</Badge>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="stat-number font-display text-3xl font-bold">
                {weeklyKm.toFixed(1)}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  / {user.weeklyGoalKm} km
                </span>
              </p>
              <Progress value={weeklyPercentage} className="mt-2 h-2" />
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                {weeklyKm >= user.weeklyGoalKm
                  ? 'Target tercapai. Kamu luar biasa!'
                  : `Sisa ${Math.max(0, user.weeklyGoalKm - weeklyKm).toFixed(1)} km lagi minggu ini.`}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-background/40 px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Target className="size-3 text-primary" /> Target berikutnya
                </span>
                <span className="text-[10px] font-semibold">10K &lt; 55 menit</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Rekor pribadi</CardTitle>
              <Trophy className="size-4 text-primary" />
            </CardHeader>
            <CardContent className="divide-y divide-border/70 pt-1">
              {personalRecords.map((record) => (
                <div key={record.label} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">{record.label}</p>
                    <p className="text-[9px] text-muted-foreground">{record.note}</p>
                  </div>
                  <span className="stat-number font-display text-sm font-semibold text-primary">
                    {record.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle>Pengaturan</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/70 pt-0">
              <SettingRow
                icon={theme === 'dark' ? Moon : Sun}
                title="Mode gelap"
                description="Tampilan yang nyaman di malam hari"
                checked={theme === 'dark'}
                onToggle={toggleTheme}
              />
              <SettingRow
                icon={Bell}
                title="Notifikasi"
                description="Pengingat sesi dan interaksi"
                checked={notifications}
                onToggle={() => setNotifications((value) => !value)}
              />
              <SettingRow
                icon={Globe2}
                title="Profil publik"
                description="Siapa pun bisa melihat aktivitasmu"
                checked={publicProfile}
                onToggle={() => setPublicProfile((value) => !value)}
              />
              <SettingRow
                icon={Ruler}
                title="Satuan metrik"
                description="Kilometer, meter, dan menit per km"
                checked
                disabled
              />
              <SettingRow
                icon={ShieldCheck}
                title="Privasi lokasi"
                description="Sembunyikan titik awal dan akhir rute"
                checked={false}
                disabled
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
