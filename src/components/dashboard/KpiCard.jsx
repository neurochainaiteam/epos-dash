import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

/**
 * Headline KPI card. `delta` is a % change vs the prior period.
 * `goodWhenUp` controls whether an increase is coloured positive (revenue)
 * or negative (costs).
 */
export default function KpiCard({ label, value, sub, delta, goodWhenUp = true, icon: Icon, highlight = false }) {
  const hasDelta = typeof delta === 'number' && delta !== 0
  const up = delta > 0
  const positive = hasDelta ? (goodWhenUp ? up : !up) : null

  return (
    <Card className={cn('p-5', highlight && 'ring-1 ring-primary/30')}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', highlight ? 'bg-primary/15 text-brand-cyanText' : 'bg-muted text-muted-foreground')}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</div>
      <div className="mt-1.5 flex items-center gap-2">
        {hasDelta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
              positive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </Card>
  )
}
