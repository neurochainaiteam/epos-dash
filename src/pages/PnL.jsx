import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Users2, Receipt, Wallet, ArrowRight, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { ROLES } from '@/config/roles'
import { gbp, pct, cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const PERIODS = [
  { key: 'day',   label: 'Today' },
  { key: 'week',  label: 'This week' },
  { key: 'month', label: 'This month' },
]

function HeroMetric({ label, value, target, hint, icon: Icon, goodBelow = true }) {
  const onTarget = goodBelow ? value <= target : value >= target
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', onTarget ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning')}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{pct(value)}</div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{hint}</span>
        <Badge variant={onTarget ? 'success' : 'warning'}>target {pct(target, { decimals: 0 })}</Badge>
      </div>
    </Card>
  )
}

export default function PnL() {
  const { locationId, role } = useApp()
  const [period, setPeriod] = useState('day')
  const isDirector = role === ROLES.DIRECTOR

  const { data: pnl, loading: pnlLoading, error: pnlError } = useQuery(
    () => db.fetchPnL(locationId, period),
    [locationId, period],
  )
  const { data: expenseCats, loading: expLoading, error: expError } = useQuery(
    () => db.fetchExpensesByCategory(locationId),
    [locationId],
  )

  const loading = pnlLoading || expLoading
  const error   = pnlError   || expError

  const { labourPct, foodPct, netPct, overheadsAmt } = useMemo(() => {
    if (!pnl?.totals) return { labourPct: 0, foodPct: 0, netPct: 0, overheadsAmt: 0 }
    const { totals } = pnl
    const rev = totals.revenue || 1
    return {
      labourPct:   (totals.labour   / rev) * 100,
      foodPct:     (totals.cogs     / rev) * 100,
      netPct:      (totals.netProfit/ rev) * 100,
      overheadsAmt: totals.overheads,
    }
  }, [pnl])

  const cats = expenseCats || []
  const maxCat = Math.max(1, ...cats.map((c) => c.amount))

  return (
    <div>
      <PageHeader title="Profit &amp; Loss" description="Revenue, costs and margins">
        <div className="inline-flex rounded-lg border bg-card p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                period === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="space-y-5 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Featured margins */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-20 w-full" /></Card>)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <HeroMetric label="Labour cost %" value={labourPct} target={25} hint="Wages ÷ revenue" icon={Users2} />
            <HeroMetric label="Food cost %" value={foodPct} target={32} hint="COGS ÷ revenue" icon={Receipt} />
            <HeroMetric label="Net profit margin" value={netPct} target={20} hint="Net ÷ revenue" icon={TrendingUp} goodBelow={false} />
          </div>
        )}

        {/* Statement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">P&amp;L statement · {PERIODS.find((p) => p.key === period)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <div className="divide-y">
                {(pnl?.rows || []).map((row) => {
                  const isTotal = row.kind === 'total'
                  const isSub   = row.kind === 'subtotal'
                  const negative = row.amount < 0
                  return (
                    <div
                      key={row.label}
                      className={cn(
                        'flex items-center justify-between py-3',
                        (isTotal || isSub) && 'font-semibold',
                        isTotal && 'mt-1 rounded-lg bg-accent/50 px-3 text-base',
                      )}
                    >
                      <span className={cn(isTotal ? 'text-foreground' : 'text-foreground/90')}>{row.label}</span>
                      <div className="flex items-center gap-6">
                        <span className={cn('w-28 text-right tabular-nums', negative ? 'text-destructive' : isTotal ? 'text-brand-cyanText' : 'text-foreground')}>
                          {negative ? `(${gbp(Math.abs(row.amount))})` : gbp(row.amount)}
                        </span>
                        <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">{pct(row.pct)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Figures are net of VAT. Overheads include rent, utilities, insurance and packaging.
            </p>
          </CardContent>
        </Card>

        {/* Overheads composition */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-brand-cyanText" /> Overheads breakdown
            </CardTitle>
            {isDirector && (
              <Link to="/expenses" className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyanText hover:underline">
                Manage expenses <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full" /> : (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  The <span className="font-medium text-foreground">{gbp(Math.abs(overheadsAmt))}</span> overheads line is fed by logged business expenses:
                </p>
                <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {cats.map((c) => (
                    <div key={c.category}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/85">{c.category}</span>
                        <span className="font-semibold tabular-nums">{gbp(c.amount)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-brand-cyan/70" style={{ width: `${(c.amount / maxCat) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
