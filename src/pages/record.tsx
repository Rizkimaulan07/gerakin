import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CircleStop,
  LocateFixed as Gps,
  Info,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Satellite,
  Sparkles,
  TimerReset,
} from 'lucide-react'
import { toast } from 'sonner'
import type { LatLng, SportKey } from '@/types'
import { DEFAULT_CENTER, estimateCalories, haversineDistance, loopRoute, routeDistance } from '@/lib/geo'
import { formatDistance, formatDuration, formatPace, formatSpeed } from '@/lib/format'
import { SPORTS, SPORT_LIST } from '@/lib/sports'
import { useCurrentLocation } from '@/hooks/use-current-location'
import { useAppStore } from '@/store/use-app-store'
import { ActivityMap } from '@/components/activity-map'
import { SportIcon } from '@/components/sport-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type RecordingStatus = 'idle' | 'recording' | 'paused'

function defaultTitle(sport: SportKey) {
  const hour = new Date().getHours()
  const timeOfDay =
    hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 19 ? 'sore' : 'malam'
  return `${SPORTS[sport].label} ${timeOfDay}`
}

export function RecordPage() {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)
  const addActivity = useAppStore((state) => state.addActivity)

  const [sport, setSport] = useState<SportKey>('run')
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [route, setRoute] = useState<LatLng[]>([])
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState(user.city)
  const [locationTouched, setLocationTouched] = useState(false)
  const [manualDistance, setManualDistance] = useState('')
  const [saving, setSaving] = useState(false)
  const [focusNonce, setFocusNonce] = useState(0)
  const [liveLocation, setLiveLocation] = useState<{
    position: LatLng
    accuracy: number
  } | null>(null)

  const currentLocation = useCurrentLocation(true)
  const mapLocation = demoMode ? null : liveLocation ?? currentLocation.location
  const positionsRef = useRef<LatLng[]>([])
  const demoIndexRef = useRef(0)
  const demoRouteRef = useRef(loopRoute(DEFAULT_CENTER, 0.8, 1200, 0.1))
  const supportsGps = SPORTS[sport].supportsGps
  const liveDistanceM = manualDistance
    ? Math.max(0, Number(manualDistance) || 0) * 1000
    : routeDistance(route)
  const livePace = liveDistanceM > 0 && elapsed > 0 ? elapsed / (liveDistanceM / 1000) : 0
  const liveSpeed = elapsed > 0 ? liveDistanceM / 1000 / (elapsed / 3600) : 0
  const calories = estimateCalories(sport, elapsed, liveDistanceM)

  useEffect(() => {
    if (status !== 'recording' || demoMode) return
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(interval)
  }, [demoMode, status])

  useEffect(() => {
    if (status !== 'recording' || demoMode) return
    if (!supportsGps) return

    if (!('geolocation' in navigator)) {
      setGpsError('Perangkat ini tidak mendukung GPS browser.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        const points = positionsRef.current
        const lastPoint = points[points.length - 1]
        setGpsAccuracy(position.coords.accuracy)
        setLiveLocation({
          position: nextPoint,
          accuracy: position.coords.accuracy,
        })
        setGpsError(null)

        if (!lastPoint) {
          positionsRef.current = [nextPoint]
          setRoute(positionsRef.current)
          return
        }

        const distance = haversineDistance(lastPoint, nextPoint)
        if (distance < 1.8 || distance > 150) return

        positionsRef.current = [...points, nextPoint]
        setRoute(positionsRef.current)
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Izin lokasi ditolak. Kamu masih bisa merekam dengan jarak manual.')
        } else {
          setGpsError('Sinyal GPS belum didapat. Cari area terbuka atau isi jarak manual.')
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [demoMode, status, supportsGps])

  useEffect(() => {
    if (status !== 'recording' || !demoMode) return

    const interval = window.setInterval(() => {
      // Demo mode fast-forwards 10 seconds so the experience is testable indoors.
      setElapsed((value) => value + 10)
      const demoRoute = demoRouteRef.current
      const nextIndex = Math.min(demoIndexRef.current + 10, demoRoute.length - 1)
      const newPoints = demoRoute.slice(0, nextIndex + 1)
      demoIndexRef.current = nextIndex
      positionsRef.current = newPoints
      setRoute(newPoints)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [demoMode, status])

  useEffect(() => {
    if (!currentLocation.place || locationTouched) return
    setLocation(currentLocation.place.label)
  }, [currentLocation.place, locationTouched])

  function resetSession() {
    setStatus('idle')
    setElapsed(0)
    setRoute([])
    positionsRef.current = []
    demoIndexRef.current = 0
    setStartedAt(null)
    setGpsAccuracy(null)
    setGpsError(null)
    setLiveLocation(null)
    setManualDistance('')
    setTitle('')
    setLocationTouched(false)
    setSaving(false)
  }

  function startRecording() {
    if (supportsGps && !demoMode) currentLocation.requestLocation()
    setElapsed(0)
    setRoute([])
    positionsRef.current = []
    demoIndexRef.current = 0
    setLiveLocation(null)
    setStartedAt(new Date().toISOString())
    setGpsAccuracy(null)
    setGpsError(null)
    setStatus('recording')
    setFocusNonce((value) => value + 1)
    toast.success(
      demoMode ? 'Mode demo dimulai — waktu berjalan 10× lebih cepat' : 'Rekaman dimulai',
    )
  }

  function recenterMap() {
    if (!demoMode && !mapLocation) currentLocation.requestLocation()
    setFocusNonce((value) => value + 1)
  }

  function pauseRecording() {
    setStatus('paused')
    toast.info('Rekaman dijeda')
  }

  async function finishRecording() {
    if (elapsed < 5) {
      toast.error('Rekam minimal 5 detik sebelum menyimpan.')
      return
    }
    if (saving) return

    setSaving(true)
    const points = positionsRef.current
    const distanceM = manualDistance
      ? Math.max(0, Number(manualDistance) || 0) * 1000
      : routeDistance(points)

    const activity = {
      id: `activity-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userInitials: user.initials,
      userColor: user.color,
      sport,
      title: title.trim() || `${defaultTitle(sport)} di ${location || user.city}`,
      description: '',
      date: startedAt ?? new Date().toISOString(),
      distanceM,
      durationS: elapsed,
      elevationM: 0,
      calories: estimateCalories(sport, elapsed, distanceM),
      route: points,
      location: location.trim() || currentLocation.place?.label || user.city,
      kudos: 0,
      comments: [],
      isManual: points.length === 0,
    }

    const result = await addActivity(activity)
    if (result.synced) toast.success('Aktivitas tersimpan di database!')
    resetSession()
    navigate(`/activities/${result.activity.id}`)
  }

  function discardRecording() {
    if (!window.confirm('Batalkan sesi ini? Data rekaman akan hilang.')) return
    resetSession()
    toast.info('Sesi dibatalkan')
  }

  const statusLabel =
    status === 'recording' ? 'Sedang merekam' : status === 'paused' ? 'Dijeda' : 'Siap mulai'
  const gpsLabel = demoMode
    ? 'Mode demo 10×'
    : !supportsGps
      ? 'Tanpa GPS'
      : gpsError
        ? 'GPS tidak aktif'
        : gpsAccuracy !== null
          ? `GPS ±${Math.round(gpsAccuracy)} m`
          : status === 'recording'
            ? 'Mencari GPS...'
            : 'GPS siap'

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1.5">
              <Gps className="size-3" />
              {supportsGps ? 'GPS tracking' : 'Input manual'}
            </Badge>
            {status === 'recording' && (
              <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                <span className="live-dot size-1.5 rounded-full bg-accent" />
                Live
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            Rekam aktivitas
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Pilih olahraga, tekan mulai, dan biarkan Gerakin mencatat rute serta statistikmu.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 sm:flex">
          <span
            className={cn(
              'size-2 rounded-full',
              status === 'recording' ? 'live-dot bg-primary' : 'bg-muted-foreground/50',
            )}
          />
          <span className="text-xs font-semibold text-foreground">{statusLabel}</span>
          <span className="text-[10px] text-muted-foreground">
            {elapsed > 0 ? formatDuration(elapsed) : '00:00'}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {SPORT_LIST.map((item) => {
          const Icon = item.icon
          const active = item.key === sport
          return (
            <button
              key={item.key}
              type="button"
              disabled={status !== 'idle'}
              onClick={() => {
                setSport(item.key)
                if (!item.supportsGps) setDemoMode(false)
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-1 py-3 text-[10px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-55',
                active
                  ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(182,242,64,0.12)_inset]'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground',
              )}
            >
              <Icon className="size-4" style={{ color: active ? item.color : undefined }} />
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card">
            <div className="hero-glow absolute inset-0 pointer-events-none" />
            <div className="relative p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SportIcon sport={sport} size="lg" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{SPORTS[sport].label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {supportsGps ? 'Rute GPS aktif' : 'Timer tanpa GPS'}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                  {demoMode ? (
                    <Sparkles className="size-3 text-primary" />
                  ) : gpsError ? (
                    <Info className="size-3 text-accent" />
                  ) : (
                    <Satellite className="size-3 text-primary" />
                  )}
                  {gpsLabel}
                </span>
              </div>

              <div className="py-7 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {statusLabel}
                </p>
                <p className="stat-number mt-1 font-display text-[60px] font-bold leading-none tracking-[-0.06em] sm:text-[72px]">
                  {formatDuration(elapsed)}
                </p>
                {demoMode && status !== 'idle' && (
                  <p className="mt-2 text-[10px] font-semibold text-primary">
                    Simulasi 10× • {Math.round(elapsed / 60)} menit simulasi
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 divide-x divide-border/70 rounded-xl border border-border/70 bg-background/40">
                <div className="px-3 py-2.5 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Jarak
                  </p>
                  <p className="stat-number mt-0.5 font-display text-base font-semibold">
                    {formatDistance(liveDistanceM)}
                  </p>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {sport === 'ride' ? 'Kecepatan' : 'Pace'}
                  </p>
                  <p className="stat-number mt-0.5 font-display text-base font-semibold">
                    {sport === 'ride' ? formatSpeed(liveSpeed) : formatPace(livePace)}
                  </p>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Kalori
                  </p>
                  <p className="stat-number mt-0.5 font-display text-base font-semibold">
                    {calories}
                  </p>
                </div>
              </div>

              {gpsError && (
                <p className="mt-3 rounded-lg border border-accent/20 bg-accent/[0.07] px-3 py-2 text-[10px] leading-relaxed text-accent">
                  {gpsError}
                </p>
              )}

              <div className="mt-5">
                {status === 'idle' && (
                  <>
                    {supportsGps && (
                      <button
                        type="button"
                        onClick={() => setDemoMode((value) => !value)}
                        role="switch"
                        aria-checked={demoMode}
                        className={cn(
                          'mb-3 flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors',
                          demoMode
                            ? 'border-primary/30 bg-primary/[0.07]'
                            : 'border-border bg-background/30 hover:border-primary/20',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className={cn('size-4', demoMode ? 'text-primary' : 'text-muted-foreground')} />
                          <span>
                            <span className="block text-xs font-semibold text-foreground">
                              Mode demo 10×
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              Coba tanpa GPS, cocok untuk uji coba cepat
                            </span>
                          </span>
                        </span>
                        <span
                          className={cn(
                            'relative h-5 w-9 rounded-full transition-colors',
                            demoMode ? 'bg-primary' : 'bg-secondary',
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-0.5 size-4 rounded-full bg-background transition-all',
                              demoMode ? 'left-[18px]' : 'left-0.5',
                            )}
                          />
                        </span>
                      </button>
                    )}
                    <Button size="lg" className="w-full gap-2" onClick={startRecording}>
                      <Play className="size-4 fill-current" />
                      Mulai {SPORTS[sport].label.toLowerCase()}
                    </Button>
                  </>
                )}

                {status === 'recording' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="lg" variant="secondary" className="gap-2" onClick={pauseRecording}>
                      <Pause className="size-4 fill-current" />
                      Jeda
                    </Button>
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={finishRecording}
                      disabled={saving}
                    >
                      <CircleStop className="size-4" />
                      {saving ? 'Menyimpan...' : 'Selesai'}
                    </Button>
                  </div>
                )}

                {status === 'paused' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="lg" className="gap-2" onClick={() => setStatus('recording')}>
                      <Play className="size-4 fill-current" />
                      Lanjut
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="gap-2"
                      onClick={finishRecording}
                      disabled={saving}
                    >
                      <CircleStop className="size-4" />
                      {saving ? 'Menyimpan...' : 'Selesai'}
                    </Button>
                  </div>
                )}

                {status !== 'idle' && (
                  <button
                    type="button"
                    onClick={discardRecording}
                    className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <RotateCcw className="size-3" />
                    Batalkan sesi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 lg:row-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-border/80">
            <ActivityMap
              route={route}
              currentLocation={mapLocation}
              follow={status === 'recording'}
              focus={
                demoMode
                  ? DEFAULT_CENTER
                  : route[route.length - 1] ?? mapLocation?.position ?? null
              }
              focusNonce={focusNonce}
              className="h-[420px] sm:h-[520px] lg:h-[600px]"
            />
            <button
              type="button"
              onClick={recenterMap}
              aria-label="Pusatkan peta ke lokasiku"
              title="Pusatkan peta ke lokasiku"
              className="absolute right-3 top-3 z-[400] grid size-9 cursor-pointer place-items-center rounded-lg border border-white/10 bg-black/65 text-white/85 shadow-lg backdrop-blur-md transition-colors hover:bg-black/85 hover:text-primary"
            >
              <Gps className="size-4" />
            </button>
            <div className="pointer-events-none absolute left-3 top-3 z-[400] flex flex-col gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] font-semibold text-white/85 backdrop-blur-md">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    status === 'recording' ? 'live-dot bg-primary' : 'bg-white/40',
                  )}
                />
                {status === 'recording' ? 'Merekam rute' : 'Peta rute'}
              </span>
              {route.length > 1 && (
                <span className="rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] font-medium text-white/70 backdrop-blur-md">
                  {route.length.toLocaleString('id-ID')} titik GPS
                </span>
              )}
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 z-[400] max-w-[75%] rounded-xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-white/85">
                <MapPin className="size-3 text-primary" />
                {location || user.city}
              </p>
              <p className="mt-0.5 text-[9px] text-white/50">
                {demoMode
                  ? 'Rute simulasi di sekitar GBK, Jakarta'
                  : 'Rute mengikuti posisi GPS perangkatmu'}
              </p>
            </div>
          </div>
        </div>

        <details className="group mt-4 rounded-2xl border border-border/80 bg-card lg:col-span-5 lg:mt-0">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-xs font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <TimerReset className="size-4 text-muted-foreground" />
              Detail sesi & jarak manual
            </span>
            <span className="text-[10px] font-medium text-muted-foreground group-open:hidden">
              Buka
            </span>
            <span className="hidden text-[10px] font-medium text-muted-foreground group-open:inline">
              Tutup
            </span>
          </summary>
          <div className="space-y-3 border-t border-border/70 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="record-title">Judul aktivitas</Label>
              <Input
                id="record-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={`${defaultTitle(sport)} di ${user.city}`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="record-location">
                  <MapPin className="mr-1 inline size-3" /> Lokasi
                </Label>
                <Input
                  id="record-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Lokasi aktivitas"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="record-distance">Jarak manual (km)</Label>
                <Input
                  id="record-distance"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  value={manualDistance}
                  onChange={(event) => setManualDistance(event.target.value)}
                  placeholder="Kosongkan untuk GPS"
                />
              </div>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Isi jarak manual kalau kamu merekam di treadmill atau memilih olahraga tanpa GPS.
              Kalau diisi, nilai ini menggantikan jarak dari GPS.
            </p>
          </div>
        </details>

        <div className="mt-4 rounded-2xl border border-border/80 bg-card p-4 lg:col-span-12 lg:mt-0">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Satellite className="size-3.5 text-primary" />
            Tips rekaman akurat
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              ['Di luar ruangan', 'GPS paling akurat saat langit terlihat.'],
              ['Izin lokasi', 'Pilih “Izinkan” saat browser meminta.'],
              ['Baterai cukup', 'Rekaman panjang menguras baterai.'],
            ].map(([tipTitle, tipDescription]) => (
              <div key={tipTitle} className="rounded-xl bg-secondary/50 p-2.5">
                <p className="text-[10px] font-semibold text-foreground">{tipTitle}</p>
                <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">
                  {tipDescription}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
