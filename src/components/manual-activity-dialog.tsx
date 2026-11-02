import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock3, MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { SPORTS, SPORT_LIST } from '@/lib/sports'
import { estimateCalories } from '@/lib/geo'
import { formatShortDate } from '@/lib/format'
import { useAppStore } from '@/store/use-app-store'
import type { SportKey } from '@/types'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'

const today = new Date().toISOString().slice(0, 10)
const nowTime = new Date().toTimeString().slice(0, 5)

export function ManualActivityDialog({
  triggerLabel = 'Catat manual',
  variant = 'outline',
}: {
  triggerLabel?: string
  variant?: 'outline' | 'default' | 'secondary'
}) {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)
  const addActivity = useAppStore((state) => state.addActivity)
  const [open, setOpen] = useState(false)
  const [sport, setSport] = useState<SportKey>('run')
  const [title, setTitle] = useState('')
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [location, setLocation] = useState('Jakarta')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today)
  const [time, setTime] = useState(nowTime)

  function resetForm() {
    setSport('run')
    setTitle('')
    setDistance('')
    setDuration('')
    setDescription('')
    setDate(today)
    setTime(nowTime)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const minutes = Number(duration)
    const kilometers = Number(distance || 0)

    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error('Durasi harus lebih dari 0 menit')
      return
    }

    const durationS = Math.round(minutes * 60)
    const distanceM = Math.max(0, kilometers) * 1000
    const activityDate = new Date(`${date}T${time || '06:00'}:00`).toISOString()
    const activityTitle =
      title.trim() ||
      `${SPORTS[sport].label} ${formatShortDate(activityDate)}`

    const activity = {
      id: `activity-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userInitials: user.initials,
      userColor: user.color,
      sport,
      title: activityTitle,
      description: description.trim(),
      date: activityDate,
      distanceM,
      durationS,
      elevationM: 0,
      calories: estimateCalories(sport, durationS, distanceM),
      route: [],
      location: location.trim() || 'Lokasi tidak dicatat',
      kudos: 0,
      comments: [],
      isManual: true,
    }

    addActivity(activity)
    toast.success('Aktivitas manual tersimpan')
    setOpen(false)
    resetForm()
    navigate(`/activities/${activity.id}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant} className="gap-2">
          <Plus className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat aktivitas manual</DialogTitle>
          <DialogDescription>
            Cocok untuk gym, renang, yoga, atau sesi tanpa GPS. Isi durasi dan jarak
            seperlunya.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SPORT_LIST.map((item) => {
              const Icon = item.icon
              const active = sport === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSport(item.key)}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-semibold transition-all"
                  style={{
                    borderColor: active ? item.color : 'var(--border)',
                    backgroundColor: active ? item.bg : 'transparent',
                    color: active ? item.color : 'var(--muted-foreground)',
                  }}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-title">Judul aktivitas</Label>
            <Input
              id="manual-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: Gym upper body"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="manual-distance">Jarak (km)</Label>
              <Input
                id="manual-distance"
                inputMode="decimal"
                type="number"
                min="0"
                step="0.1"
                value={distance}
                onChange={(event) => setDistance(event.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-duration">Durasi (menit)</Label>
              <Input
                id="manual-duration"
                inputMode="numeric"
                type="number"
                min="1"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="45"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="manual-date">
                <CalendarDays className="mr-1 inline size-3" /> Tanggal
              </Label>
              <Input
                id="manual-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-time">
                <Clock3 className="mr-1 inline size-3" /> Jam mulai
              </Label>
              <Input
                id="manual-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-location">
              <MapPin className="mr-1 inline size-3" /> Lokasi
            </Label>
            <Input
              id="manual-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Nama tempat"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-description">Catatan</Label>
            <Textarea
              id="manual-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Bagaimana sesi kamu hari ini?"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan aktivitas</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
