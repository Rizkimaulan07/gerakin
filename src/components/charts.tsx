import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatClockPace, formatPace } from '@/lib/format'
import type { WeeklyPoint } from '@/types'

interface ChartTooltipViewProps {
  active?: boolean
  payload?: ReadonlyArray<{ value?: number | string | Array<number | string> }>
  label?: string | number
}

function DistanceTooltip({ active, payload, label }: ChartTooltipViewProps) {
  if (!active || !payload?.length) return null
  const value = Number(payload[0]?.value ?? 0)

  return (
    <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-base font-semibold text-foreground">{value} km</p>
    </div>
  )
}

export function WeeklyChart({ data }: { data: WeeklyPoint[] }) {
  const max = Math.max(...data.map((point) => point.distanceKm))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -18 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
          width={42}
          tickFormatter={(value: number) => `${value}`}
        />
        <Tooltip content={<DistanceTooltip />} cursor={{ fill: 'rgba(151,161,138,0.06)' }} />
        <Bar dataKey="distanceKm" radius={[7, 7, 3, 3]} maxBarSize={30}>
          {data.map((point, index) => (
            <Cell
              key={point.day}
              fill="var(--chart-1)"
              opacity={point.distanceKm === max && max > 0 ? 1 : 0.38 + index * 0.035}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

interface SplitPoint {
  km: number
  pace: number
}

function PaceTooltip({ active, payload, label }: ChartTooltipViewProps) {
  if (!active || !payload?.length) return null
  const value = Number(payload[0]?.value ?? 0)

  return (
    <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Km {label}
      </p>
      <p className="font-display text-base font-semibold text-foreground">{formatPace(value)}</p>
    </div>
  )
}

export function PaceChart({ splits }: { splits: SplitPoint[] }) {
  const fastest = Math.min(...splits.map((split) => split.pace))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={splits} margin={{ top: 8, right: 0, bottom: 0, left: -20 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
        <XAxis
          dataKey="km"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600 }}
          dy={8}
          tickFormatter={(value: number) => `${value}`}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
          width={48}
          reversed
          domain={['dataMin - 15', 'dataMax + 10']}
          tickFormatter={(value: number) => formatClockPace(value)}
        />
        <Tooltip content={<PaceTooltip />} cursor={{ fill: 'rgba(151,161,138,0.06)' }} />
        <Bar dataKey="pace" radius={[6, 6, 3, 3]} maxBarSize={32}>
          {splits.map((split) => (
            <Cell
              key={split.km}
              fill={split.pace === fastest ? 'var(--chart-1)' : 'var(--chart-3)'}
              opacity={split.pace === fastest ? 1 : 0.65}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
