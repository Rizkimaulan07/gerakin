import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_-6px_rgba(182,242,64,0.75)]',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
        <path
          d="M4 17.5 9.2 7l3.1 6.2 2.2-4.1L20 17.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="19.2" cy="6.2" r="2" fill="currentColor" />
      </svg>
    </span>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Gerakin — Beranda"
    >
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      {!compact && (
        <span className="font-display text-[22px] font-bold tracking-[-0.055em]">
          gerakin<span className="text-primary">.</span>
        </span>
      )}
    </Link>
  )
}
