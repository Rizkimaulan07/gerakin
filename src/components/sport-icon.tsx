import { cn } from '@/lib/utils'
import { SPORTS } from '@/lib/sports'
import type { SportKey } from '@/types'

export function SportIcon({
  sport,
  size = 'md',
  className,
}: {
  sport: SportKey
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const meta = SPORTS[sport]
  const Icon = meta.icon

  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-lg',
        size === 'sm' && 'size-6',
        size === 'md' && 'size-8',
        size === 'lg' && 'size-10 rounded-xl',
        className,
      )}
      style={{ color: meta.color, backgroundColor: meta.bg }}
      title={meta.label}
    >
      <Icon className={cn(size === 'sm' ? 'size-3' : size === 'md' ? 'size-4' : 'size-5')} />
    </span>
  )
}

export function SportLabel({ sport, className }: { sport: SportKey; className?: string }) {
  const meta = SPORTS[sport]
  const Icon = meta.icon

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', className)}>
      <Icon className="size-3.5" style={{ color: meta.color }} />
      {meta.label}
    </span>
  )
}
