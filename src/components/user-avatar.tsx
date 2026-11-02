import { cn } from '@/lib/utils'

const sizes = {
  xs: 'size-6 text-[9px]',
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-xs',
  lg: 'size-14 text-base',
  xl: 'size-24 text-2xl',
}

interface UserAvatarProps {
  name: string
  initials: string
  color: string
  size?: keyof typeof sizes
  className?: string
  ring?: boolean
}

export function UserAvatar({
  name,
  initials,
  color,
  size = 'md',
  className,
  ring = false,
}: UserAvatarProps) {
  return (
    <span
      title={name}
      aria-label={name}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-bold uppercase tracking-tight text-[#17200a]',
        sizes[size],
        ring && 'ring-2 ring-background ring-offset-2 ring-offset-card',
        className,
      )}
      style={{
        background: `linear-gradient(140deg, ${color}, ${color} 62%, rgba(255,255,255,0.55) 145%)`,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.08) inset, 0 4px 18px -8px ${color}`,
      }}
    >
      {initials}
    </span>
  )
}
