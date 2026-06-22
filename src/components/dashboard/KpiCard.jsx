import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <Card className={cn('p-6', highlight && 'ring-1 ring-primary/30')}>
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyanText">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</div>
      <div className="mt-1.5 flex items-center gap-2">
        {hasDelta && (
          <Badge variant={positive ? 'success' : 'destructive'} className="gap-0.5 rounded-full px-1.5 py-0.5">
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </Badge>
        )}
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </Card>
  )
}
