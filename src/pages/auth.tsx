import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bike,
  Check,
  Footprints,
  Globe2,
  LockKeyhole,
  MapPinned,
  Smartphone,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoMark } from '@/components/logo'
import { useAppStore } from '@/store/use-app-store'
import { cn } from '@/lib/utils'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const navigate = useNavigate()
  const authStatus = useAppStore((state) => state.authStatus)
  const authError = useAppStore((state) => state.authError)
  const login = useAppStore((state) => state.login)
  const register = useAppStore((state) => state.register)
  const checkSession = useAppStore((state) => state.checkSession)
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (authStatus === 'authenticated') navigate('/', { replace: true })
  }, [authStatus, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setPending(true)

    try {
      if (mode === 'register') {
        await register({ name: name.trim(), email: email.trim(), password })
      } else {
        await login({ email: email.trim(), password })
      }
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Tidak dapat memproses akun.')
    } finally {
      setPending(false)
    }
  }

  const isRegistering = mode === 'register'
  const isChecking = authStatus === 'checking'

  return (
    <main className="app-grid min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center gap-2.5">
          <LogoMark className="size-10 rounded-xl" />
          <span className="font-display text-2xl font-bold tracking-[-0.06em]">
            gerakin<span className="text-primary">.</span>
          </span>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <section className="mx-auto w-full max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Ruang gerakmu dimulai di sini
            </span>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-bold leading-[1.08] tracking-[-0.06em] sm:text-5xl">
              Setiap langkah
              <span className="block text-primary">berarti.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
              Catat lari, gowes, dan aktivitasmu. Pantau progres, temukan rute baru, lalu bergerak
              bareng komunitas Gerakin.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Footprints, label: 'Catat aktivitas' },
                { icon: MapPinned, label: 'Ikuti rute GPS' },
                { icon: Trophy, label: 'Kejar tantangan' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card/80 px-3 py-3 text-xs font-semibold text-foreground"
                >
                  <Icon className="size-4 shrink-0 text-primary" />
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Tentang aplikasinya
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Globe2 className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Aplikasi web</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Sudah bisa dibuka lewat browser di HP dan komputer.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                    <Smartphone className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">APK Android</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Belum tersedia untuk diunduh. Gunakan versi web untuk sekarang.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_24px_80px_-48px_rgba(23,27,18,0.28)] sm:p-8">
              <div className="flex rounded-xl bg-secondary/70 p-1">
                {(['login', 'register'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setMode(option)
                      setFormError(null)
                    }}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                      mode === option
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {option === 'login' ? 'Masuk' : 'Buat akun'}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  {isRegistering ? 'Mulai bergerak' : 'Selamat datang kembali'}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {isRegistering
                    ? 'Buat akun Gerakin untuk menyimpan progresmu.'
                    : 'Masuk untuk melihat aktivitas dan progresmu.'}
                </p>
              </div>

              {authStatus === 'error' && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <p>{authError ?? 'Server tidak dapat dihubungi.'}</p>
                  <button
                    type="button"
                    onClick={() => void checkSession()}
                    className="mt-2 cursor-pointer font-semibold underline underline-offset-2"
                  >
                    Coba sambungkan lagi
                  </button>
                </div>
              )}

              {formError && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {formError}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {isRegistering && (
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-name">Nama</Label>
                    <Input
                      id="auth-name"
                      autoComplete="name"
                      minLength={2}
                      maxLength={100}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Nama lengkap"
                      required
                      disabled={pending || isChecking}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@email.com"
                    required
                    disabled={pending || isChecking}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-password">Kata sandi</Label>
                    <LockKeyhole className="size-3.5 text-muted-foreground" />
                  </div>
                  <Input
                    id="auth-password"
                    type="password"
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                    minLength={isRegistering ? 8 : undefined}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isRegistering ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
                    required
                    disabled={pending || isChecking}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 w-full justify-between"
                  disabled={pending || isChecking}
                >
                  <span>
                    {isChecking
                      ? 'Memeriksa sesi...'
                      : pending
                        ? 'Memproses...'
                        : isRegistering
                          ? 'Buat akun'
                          : 'Masuk ke Gerakin'}
                  </span>
                  {!pending && !isChecking && <ArrowRight className="size-4" />}
                </Button>
              </form>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
                <Check className="size-3.5 shrink-0 text-primary" />
                {isRegistering
                  ? 'Akunmu dibuat dengan kata sandi yang disimpan secara aman.'
                  : 'Masuk untuk melanjutkan ke dashboard Gerakin.'}
              </p>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(isRegistering ? 'login' : 'register')
                  setFormError(null)
                }}
                className="cursor-pointer font-semibold text-primary hover:underline"
              >
                {isRegistering ? 'Masuk' : 'Daftar sekarang'}
              </button>
            </p>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>Gerakin · Setiap langkah berarti.</span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <Bike className="size-3.5" />
            Bergerak sesuai ritmemu
          </span>
        </footer>
      </div>
    </main>
  )
}
