import { useId } from 'react'
import { cn } from '@/lib/utils'

interface GoalRingProps {
  value: number
  goal: number
  unit?: string
  caption?: string
  className?: string
}

export function GoalRing({ value, goal, unit = 'km', caption = 'Minggu ini', className }: GoalRingProps) {
  const id = useId().replaceAll(':', '')
  const percentage = Math.min(100, Math.round((value / Math.max(goal, 1)) * 100))
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('relative grid place-items-center', className)}>
      <svg viewBox="0 0 180 180" className="size-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={`goal-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f2c14e" />
            <stop offset="55%" stopColor="#b6f240" />
            <stop offset="100%" stopColor="#52c7b8" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--secondary)" strokeWidth="10" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={`url(#goal-${id})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="whitespace-nowrap px-4 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {caption}
        </span>
        <span className="stat-number font-display text-4xl font-bold text-foreground">
          {value}
          <span className="ml-0.5 text-base font-medium text-muted-foreground">{unit}</span>
        </span>
        <span className="mt-0.5 text-[11px] font-semibold text-primary">{percentage}% dari target</span>
      </div>
    </div>
  )
}
