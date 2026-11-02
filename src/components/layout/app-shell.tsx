import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  CirclePlay,
  Compass,
  Home,
  LogOut,
  ListChecks,
  Moon,
  Search,
  Sun,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/use-app-store'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { UserAvatar } from '@/components/user-avatar'
import { GlobalSearch } from '@/components/global-search'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/feed', label: 'Feed', icon: Users },
  { to: '/activities', label: 'Aktivitas', icon: ListChecks },
  { to: '/explore', label: 'Jelajah', icon: Compass },
]

const communityItems = [
  { to: '/challenges', label: 'Tantangan', icon: Trophy },
  { to: '/clubs', label: 'Klub', icon: UsersRound },
]

const mobileNav = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/activities', label: 'Aktivitas', icon: ListChecks },
  { to: '/record', label: 'Rekam', icon: CirclePlay, primary: true },
  { to: '/feed', label: 'Feed', icon: Users },
  { to: '/profile', label: 'Profil', icon: Users },
]

const pageTitles: Record<string, string> = {
  '/': 'Beranda',
  '/feed': 'Feed',
  '/activities': 'Aktivitas',
  '/record': 'Rekam aktivitas',
  '/explore': 'Jelajah',
  '/challenges': 'Tantangan',
  '/clubs': 'Klub',
  '/profile': 'Profil',
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/activities/')) return 'Detail aktivitas'
  return pageTitles[pathname] ?? 'Gerakin'
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-4 transition-transform group-hover:scale-105', isActive && 'stroke-[2.3]')} />
          <span>{label}</span>
          {isActive && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
        </>
      )}
    </NavLink>
  )
}

export function AppShell() {
  const location = useLocation()
  const user = useAppStore((state) => state.user)
  const activities = useAppStore((state) => state.activities)
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const logout = useAppStore((state) => state.logout)
  const [searchOpen, setSearchOpen] = useState(false)

  const weeklyKm = useMemo(() => {
    const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000
    const total = activities
      .filter(
        (activity) =>
          activity.userId === user.id && new Date(activity.date).getTime() >= weekStart,
      )
      .reduce((sum, activity) => sum + activity.distanceM, 0)
    return total / 1000
  }, [activities, user.id])

  const goalPercentage = Math.min(100, Math.round((weeklyKm / user.weeklyGoalKm) * 100))

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  async function handleLogout() {
    try {
      await logout()
      toast.success('Kamu sudah keluar dari Gerakin.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tidak dapat keluar dari akun.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-border/80 bg-sidebar lg:flex">
        <div className="flex h-[72px] items-center px-5">
          <Logo />
        </div>

        <div className="px-3">
          <Button asChild size="lg" className="w-full justify-start rounded-xl px-3.5">
            <Link to="/record">
              <span className="grid size-6 place-items-center rounded-full bg-primary-foreground/15">
                <CirclePlay className="size-4" />
              </span>
              Mulai aktivitas
              <span className="ml-auto rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                GPS
              </span>
            </Link>
          </Button>
        </div>

        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Menu
          </p>
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}

          <p className="px-3 pb-1.5 pt-5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Komunitas
          </p>
          {communityItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>

        <div className="space-y-3 border-t border-border/80 p-3">
          <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Target minggu ini
              </span>
              <span className="text-[10px] font-bold text-primary">{goalPercentage}%</span>
            </div>
            <p className="mt-1.5 font-display text-lg font-semibold">
              {weeklyKm.toFixed(1)}
              <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                / {user.weeklyGoalKm} km
              </span>
            </p>
            <Progress value={goalPercentage} className="mt-2 h-1.5" />
          </div>

          <Link
            to="/profile"
            className="group flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-secondary"
          >
            <UserAvatar
              name={user.name}
              initials={user.initials}
              color={user.color}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">@{user.username}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <div className="hidden lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Gerakin / {getPageTitle(location.pathname)}
              </p>
              <p className="font-display text-sm font-semibold tracking-tight">
                {getPageTitle(location.pathname)}
              </p>
            </div>
            <p className="font-display text-base font-semibold tracking-tight lg:hidden">
              {getPageTitle(location.pathname)}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground sm:flex"
            >
              <Search className="size-3.5" />
              <span>Cari...</span>
              <kbd className="ml-2 rounded border border-border bg-secondary px-1 py-0.5 text-[9px] font-semibold">
                Ctrl K
              </kbd>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label="Cari"
            >
              <Search className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toast.info('Semua notifikasi sudah kamu baca')}
              aria-label="Notifikasi"
              className="relative"
            >
              <Bell className="size-4" />
              <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-accent ring-2 ring-background" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void handleLogout()}
              aria-label="Keluar dari akun"
            >
              <LogOut className="size-4" />
            </Button>
            <Link
              to="/profile"
              className="ml-1 rounded-full ring-2 ring-transparent transition-all hover:ring-primary/30"
              aria-label="Buka profil"
            >
              <UserAvatar
                name={user.name}
                initials={user.initials}
                color={user.color}
                size="sm"
              />
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
          {mobileNav.map((item) => {
            const Icon = item.icon
            if (item.primary) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="group -mt-5 flex flex-col items-center gap-0.5"
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'grid size-12 place-items-center rounded-2xl border-4 border-background bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(182,242,64,0.55)] transition-transform group-active:scale-95',
                          isActive && 'ring-2 ring-primary/30',
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        Rekam
                      </span>
                    </>
                  )}
                </NavLink>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 rounded-lg py-1.5 text-muted-foreground transition-colors',
                    isActive && 'text-primary',
                  )
                }
              >
                <Icon className="size-[18px]" />
                <span className="text-[9px] font-semibold">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
