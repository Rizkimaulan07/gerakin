import { lazy, Suspense, useEffect, useRef } from 'react'
import { HashRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { useAppStore } from '@/store/use-app-store'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo'
import { AuthPage } from '@/pages/auth'

const DashboardPage = lazy(() =>
  import('@/pages/dashboard').then((module) => ({ default: module.DashboardPage })),
)
const RecordPage = lazy(() =>
  import('@/pages/record').then((module) => ({ default: module.RecordPage })),
)
const ActivitiesPage = lazy(() =>
  import('@/pages/activities').then((module) => ({ default: module.ActivitiesPage })),
)
const ActivityDetailPage = lazy(() =>
  import('@/pages/activity-detail').then((module) => ({ default: module.ActivityDetailPage })),
)
const FeedPage = lazy(() =>
  import('@/pages/feed').then((module) => ({ default: module.FeedPage })),
)
const ExplorePage = lazy(() =>
  import('@/pages/explore').then((module) => ({ default: module.ExplorePage })),
)
const ChallengesPage = lazy(() =>
  import('@/pages/challenges').then((module) => ({ default: module.ChallengesPage })),
)
const ClubsPage = lazy(() =>
  import('@/pages/clubs').then((module) => ({ default: module.ClubsPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/profile').then((module) => ({ default: module.ProfilePage })),
)

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Memuat halaman">
      <div className="flex flex-col items-center gap-3">
        <span className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <span className="text-xs font-medium text-muted-foreground">Memuat halaman...</span>
      </div>
    </div>
  )
}

function PageSuspense() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  )
}

function RequireAuth() {
  const authStatus = useAppStore((state) => state.authStatus)

  if (authStatus === 'checking') return <PageLoader />
  if (authStatus !== 'authenticated') return <Navigate to="/login" replace />
  return <Outlet />
}

function NotFoundPage() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-14 rounded-2xl" />
        <p className="mt-6 font-display text-7xl font-bold tracking-tighter text-primary">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sepertinya kamu mengambil jalur yang belum dipetakan. Yuk kembali ke jalur utama.
        </p>
        <Button asChild className="mt-5">
          <Link to="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </div>
  )
}

function App() {
  const theme = useAppStore((state) => state.theme)
  const authStatus = useAppStore((state) => state.authStatus)
  const checkSession = useAppStore((state) => state.checkSession)
  const hydrated = useAppStore((state) => state.hydrated)
  const isOnline = useAppStore((state) => state.isOnline)
  const offlineNoticeShown = useRef(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0d100b' : '#f4f6ed')
  }, [theme])

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !hydrated || isOnline || offlineNoticeShown.current) return
    offlineNoticeShown.current = true
    toast.error('Server database belum tersambung. Gerakin berjalan dengan data lokal.', {
      duration: 6000,
    })
  }, [authStatus, hydrated, isOnline])

  return (
    <HashRouter>
      <Routes>
        <Route path="login" element={<AuthPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route element={<PageSuspense />}>
              <Route index element={<DashboardPage />} />
              <Route path="record" element={<RecordPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="activities/:activityId" element={<ActivityDetailPage />} />
              <Route path="feed" element={<FeedPage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="challenges" element={<ChallengesPage />} />
              <Route path="clubs" element={<ClubsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      <Toaster
        position="top-center"
        theme={theme}
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: '14px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          },
        }}
      />
    </HashRouter>
  )
}

export default App
