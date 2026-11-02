import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, MessageCircle, MoreHorizontal, Send, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Activity } from '@/types'
import { formatRelative } from '@/lib/format'
import { SPORTS } from '@/lib/sports'
import { useAppStore } from '@/store/use-app-store'
import { UserAvatar } from '@/components/user-avatar'
import { SportIcon } from '@/components/sport-icon'
import { RouteThumbnail } from '@/components/route-thumbnail'
import { ActivityMetrics } from '@/components/activity-cards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function FeedCard({ activity }: { activity: Activity }) {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const given = useAppStore((state) => state.kudosGiven.includes(activity.id))
  const toggleKudos = useAppStore((state) => state.toggleKudos)
  const addComment = useAppStore((state) => state.addComment)
  const meta = SPORTS[activity.sport]

  function submitComment(event: FormEvent) {
    event.preventDefault()
    if (!draft.trim()) return
    addComment(activity.id, draft)
    setDraft('')
    toast.success('Komentar ditambahkan')
  }

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}#/activities/${activity.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Tautan aktivitas disalin')
    } catch {
      toast.error('Tidak bisa menyalin tautan')
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border/80 bg-card">
      <div className="flex items-center gap-3 p-4 pb-3">
        <UserAvatar
          name={activity.userName}
          initials={activity.userInitials}
          color={activity.userColor}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{activity.userName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>{formatRelative(activity.date)}</span>
            <span>•</span>
            <SportIcon sport={activity.sport} size="sm" className="size-4 rounded" />
            <span style={{ color: meta.color }}>{meta.label}</span>
          </p>
        </div>
        <button
          type="button"
          aria-label="Opsi aktivitas"
          className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="px-4">
        <Link to={`/activities/${activity.id}`} className="group block">
          <h3 className="font-display text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {activity.title}
          </h3>
          {activity.description && (
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
              {activity.description}
            </p>
          )}
        </Link>
      </div>

      <Link to={`/activities/${activity.id}`} className="mx-4 mt-3 block">
        <RouteThumbnail
          route={activity.route}
          sport={activity.sport}
          className="h-52 rounded-xl border border-black/20 sm:h-64"
        />
      </Link>

      <div className="px-4 pt-3">
        <div className="mb-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3" />
          {activity.location}
        </div>
        <ActivityMetrics activity={activity} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/70 px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleKudos(activity.id)}
            aria-pressed={given}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95',
              given ? 'text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Heart className={cn('size-4 transition-transform', given && 'scale-110 fill-primary')} />
            {activity.kudos}
            <span className="hidden sm:inline">Kudos</span>
          </button>
          <button
            type="button"
            onClick={() => setCommentsOpen((open) => !open)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MessageCircle className="size-4" />
            {activity.comments.length}
            <span className="hidden sm:inline">Komentar</span>
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={share} className="px-2.5">
          <Share2 className="size-4" />
          <span className="hidden sm:inline">Bagikan</span>
        </Button>
      </div>

      {commentsOpen && (
        <div className="border-t border-border/70 bg-background/25 px-4 py-3">
          <div className="space-y-3">
            {activity.comments.length === 0 && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                Belum ada komentar. Jadi yang pertama!
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
                <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-secondary/65 px-3 py-2">
                  <p className="text-[11px] font-semibold text-foreground">{comment.name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submitComment} className="mt-3 flex items-center gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Tulis komentar..."
              className="h-9 bg-card text-xs"
            />
            <Button type="submit" size="icon-sm" disabled={!draft.trim()} aria-label="Kirim komentar">
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}
    </article>
  )
}
