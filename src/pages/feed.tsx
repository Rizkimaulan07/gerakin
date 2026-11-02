import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Plus,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { leaderboard, suggestedFriends } from '@/data/mock'
import { formatRelative } from '@/lib/format'
import { useAppStore } from '@/store/use-app-store'
import { FeedCard } from '@/components/feed-card'
import { UserAvatar } from '@/components/user-avatar'
import { SportIcon } from '@/components/sport-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function FeedPage() {
  const activities = useAppStore((state) => state.activities)
  const user = useAppStore((state) => state.user)
  const following = useAppStore((state) => state.following)
  const toggleFollow = useAppStore((state) => state.toggleFollow)
  const [filter, setFilter] = useState('for-you')

  const sorted = useMemo(
    () => [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [activities],
  )

  const visibleActivities = useMemo(() => {
    if (filter === 'mine') return sorted.filter((activity) => activity.userId === user.id)
    if (filter === 'following') {
      return sorted.filter(
        (activity) => activity.userId === user.id || following.includes(activity.userId),
      )
    }
    return sorted
  }, [filter, following, sorted, user.id])

  const stories = useMemo(() => {
    const seen = new Set<string>()
    return sorted
      .filter((activity) => {
        if (seen.has(activity.userId) || activity.userId === user.id) return false
        seen.add(activity.userId)
        return true
      })
      .slice(0, 6)
  }, [sorted, user.id])

  const topThree = leaderboard.slice(0, 4)
  const currentEntry = leaderboard.find((entry) => entry.isCurrentUser)

  function handleFollow(userId: string, name: string) {
    const isFollowing = following.includes(userId)
    toggleFollow(userId)
    toast.success(isFollowing ? `Berhenti mengikuti ${name}` : `Mulai mengikuti ${name}`)
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <Users className="size-3.5" />
            Komunitas
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Feed</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Lihat progres teman, beri kudos, dan temukan alasan baru untuk bergerak.
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link to="/record">
            <Plus className="size-4" />
            Bagikan aktivitas
          </Link>
        </Button>
      </div>

      <div className="no-scrollbar mt-6 flex items-start gap-3 overflow-x-auto pb-2">
        <Link to="/record" className="group flex w-[68px] shrink-0 flex-col items-center gap-1.5">
          <span className="relative grid size-16 place-items-center rounded-full border border-dashed border-primary/40 bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary/10">
            <Plus className="size-5" />
            <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground">
              <Sparkles className="size-2.5" />
            </span>
          </span>
          <span className="text-center text-[10px] font-semibold text-muted-foreground">Cerita kamu</span>
        </Link>

        {stories.map((activity) => (
          <Link
            key={activity.userId}
            to={`/activities/${activity.id}`}
            className="group flex w-[68px] shrink-0 flex-col items-center gap-1.5"
          >
            <span className="relative grid size-16 place-items-center rounded-full bg-[conic-gradient(from_140deg,#b6f240,#52c7b8,#ff7a45,#b6f240)] p-[2px] transition-transform group-hover:scale-105">
              <span className="grid size-full place-items-center rounded-full bg-background p-[2px]">
                <UserAvatar
                  name={activity.userName}
                  initials={activity.userInitials}
                  color={activity.userColor}
                  size="lg"
                  className="size-full text-sm"
                />
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-background bg-card">
                <SportIcon sport={activity.sport} size="sm" className="size-3.5 rounded-full bg-transparent" />
              </span>
            </span>
            <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground">
              {activity.userName.split(' ')[0]}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card px-3 py-2">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="border-0 bg-transparent p-0">
                <TabsTrigger value="for-you">Untukmu</TabsTrigger>
                <TabsTrigger value="following">Mengikuti</TabsTrigger>
                <TabsTrigger value="mine">Milikku</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="hidden text-[10px] text-muted-foreground sm:block">
              Diperbarui {sorted[0] ? formatRelative(sorted[0].date) : 'baru saja'}
            </span>
          </div>

          <div className="mt-3 space-y-4">
            {visibleActivities.map((activity) => (
              <FeedCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle>Peringkat pekan ini</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-primary">
                <Link to="/explore">
                  Semua <ChevronRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="space-y-1">
                {topThree.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 ${
                      entry.isCurrentUser ? 'bg-primary/[0.07]' : ''
                    }`}
                  >
                    <span
                      className={`w-4 text-center font-display text-[11px] font-bold ${
                        entry.rank <= 3 ? 'text-primary' : 'text-muted-foreground'
                      }`}
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
                      <p className="truncate text-[11px] font-semibold text-foreground">
                        {entry.isCurrentUser ? 'Kamu' : entry.name}
                      </p>
                    </div>
                    <span className="stat-number text-[11px] font-semibold text-muted-foreground">
                      {entry.distanceKm} km
                    </span>
                  </div>
                ))}
              </div>
              {currentEntry && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-primary/15 bg-primary/[0.06] px-2.5 py-2">
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    Posisimu saat ini
                  </span>
                  <span className="text-[11px] font-bold text-primary">#{currentEntry.rank}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Orang untuk diikuti</CardTitle>
              <p className="text-xs text-muted-foreground">Punya teman yang juga aktif</p>
            </CardHeader>
            <CardContent className="space-y-1 pt-1">
              {suggestedFriends.map((friend) => {
                const isFollowing = following.includes(friend.id)
                return (
                  <div key={friend.id} className="flex items-center gap-2.5 py-1.5">
                    <UserAvatar
                      name={friend.name}
                      initials={friend.initials}
                      color={friend.color}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-foreground">{friend.name}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {friend.mutual} teman yang sama
                      </p>
                    </div>
                    <Button
                      variant={isFollowing ? 'outline' : 'secondary'}
                      size="sm"
                      className="h-6 px-2 text-[9px]"
                      onClick={() => handleFollow(friend.id, friend.name)}
                    >
                      {isFollowing ? 'Mengikuti' : <><UserPlus className="size-2.5" /> Ikuti</>}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="hero-glow overflow-hidden border-primary/20">
            <CardContent className="p-4">
              <Badge variant="success" className="gap-1">
                <CalendarDays className="size-3" />
                Meetup komunitas
              </Badge>
              <h3 className="mt-2.5 font-display text-lg font-semibold">Weekend Run GBK</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Sabtu, 7 November • 06.00 WIB. Pacer 5K dan 10K tersedia untuk semua level.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {['DA', 'BP', 'FH'].map((initials, index) => (
                    <span
                      key={initials}
                      className="grid size-6 place-items-center rounded-full border-2 border-card text-[8px] font-bold text-[#17200a]"
                      style={{ backgroundColor: ['#ff9a62', '#52c7b8', '#f2c14e'][index] }}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">+48 akan hadir</span>
                <Button
                  size="sm"
                  className="ml-auto h-7 px-2.5 text-[10px]"
                  onClick={() => toast.success('Kamu terdaftar untuk Weekend Run GBK')}
                >
                  Ikut
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Klub aktif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-1">
              <Link
                to="/clubs"
                className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-secondary/60"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                  GR
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold">GBK Runners</p>
                  <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <MapPin className="size-2.5" /> Jakarta • 8.420 km pekan ini
                  </p>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </Link>
              <Link
                to="/clubs"
                className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-secondary/60"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-[#52c7b8]/10 text-[10px] font-bold text-[#52c7b8]">
                  NR
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold">Jakarta Night Ride</p>
                  <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <MapPin className="size-2.5" /> Jakarta • 12.680 km pekan ini
                  </p>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>

          <p className="px-2 text-center text-[9px] text-muted-foreground">
            Data feed disimpan secara lokal di browser untuk demo ini.
          </p>
        </aside>
      </div>
    </div>
  )
}
