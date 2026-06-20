import { lazy, Suspense, useMemo } from 'react'
import {
  PoundSterling, ShoppingBag, Users2, Receipt, TrendingUp, Wallet, Trophy, AlertCircle,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { locationName, TODAY_LABEL } from '@/data/mockData'
import { gbp, pct, cn } from '@/lib/utils'
import * as db from '@/lib/db'
import { useQuery } from '@/hooks/useQuery'
import PageHeader from '@/components/layout/PageHeader'
import KpiCard from '@/components/dashboard/KpiCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ChartSkeleton from '@/components/charts/ChartSkeleton'

const RevenueAreaChart = lazy(() => import('@/components/charts/RevenueAreaChart'))

function MetricGauge({ label, value, target, hint, goodBelow = true }) {
  const onTarget = goodBelow ? value <= target : value >= target
  const width = Math.min(100, (value / (target * 1.8)) * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-lg font-bold tabular-nums text-foreground">{pct(value)}</span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', onTarget ? 'bg-success' : 'bg-warning')}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{hint}</span>
        <Badge variant={onTarget ? 'success' : 'warning'}>
          {onTarget ? 'On target' : 'Watch'} · target {pct(target, { decimals: 0 })}
        </Badge>
      </div>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  )
}

export default function Dashboard() {
  const { locationId } = useApp()

  const snap   = useQuery(() => db.fetchDailySnapshot(locationId), [locationId])
  const hourly = useQuery(() => db.fetchHourlyRevenue(locationId), [locationId])
  const sellers= useQuery(() => db.fetchBestSellers(locationId),   [locationId])

  const kpis    = snap.data
  const revenue = hourly.data || []
  const sellers_ = sellers.data || []

  const metrics = useMemo(() => {
    if (!kpis) return null
    return {
      labourPct:    kpis.revenue ? (kpis.labour  / kpis.revenue) * 100 : 0,
      foodCostPct:  kpis.revenue ? (kpis.cogs    / kpis.revenue) * 100 : 0,
      netMarginPct: kpis.revenue ? (kpis.netProfit/ kpis.revenue) * 100 : 0,
    }
  }, [kpis])

  const peak = useMemo(
    () => revenue.reduce((a, b) => (b.revenue > a.revenue ? b : a), revenue[0] || { hour: 'N/A', revenue: 0 }),
    [revenue],
  )
  const maxSellerRev = Math.max(...sellers_.map((s) => s.revenue), 1)

  const deltas = useMemo(() => ({
    revenue:    { value: kpis?.revenue_delta    ?? 0 },
    cogs:       { value: kpis?.cogs_delta       ?? 0 },
    labour:     { value: kpis?.labour_delta     ?? 0 },
    overheads:  { value: kpis?.overheads_delta  ?? 0 },
    netProfit:  { value: kpis?.net_profit_delta ?? 0 },
    orderCount: { value: kpis?.order_count_delta?? 0 },
  }), [kpis])

  const loading = snap.loading || hourly.loading || sellers.loading
  const error   = snap.error   || hourly.error   || sellers.error

  return (
    <div>
      <PageHeader title="Dashboard" description={`Live trading snapshot · ${TODAY_LABEL}`}>
        <Badge variant="success" className="gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live
        </Badge>
      </PageHeader>

      <div className="space-y-5 p-5 sm:p-8">
        {error && <ErrorState message={error} />}

        {/* P&L summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-16 w-full" /></Card>
          )) : (<>
            <KpiCard label="Revenue (today)" value={gbp(kpis?.revenue ?? 0)} delta={deltas.revenue.value} icon={PoundSterling} highlight sub="vs yesterday" />
            <KpiCard label="COGS" value={gbp(kpis?.cogs ?? 0)} delta={deltas.cogs.value} goodWhenUp={false} icon={Receipt} sub={pct(metrics?.foodCostPct ?? 0) + ' of rev'} />
            <KpiCard label="Labour" value={gbp(kpis?.labour ?? 0)} delta={deltas.labour.value} goodWhenUp={false} icon={Users2} sub={pct(metrics?.labourPct ?? 0) + ' of rev'} />
            <KpiCard label="Overheads" value={gbp(kpis?.overheads ?? 0)} delta={deltas.overheads.value} goodWhenUp={false} icon={Wallet} sub="rent, utilities" />
            <KpiCard label="Net profit" value={gbp(kpis?.netProfit ?? 0)} delta={deltas.netProfit.value} icon={TrendingUp} highlight sub={pct(metrics?.netMarginPct ?? 0) + ' margin'} />
          </>)}
        </div>

        {/* Featured margins + revenue chart */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Key margins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? <Skeleton className="h-40 w-full" /> : (<>
                <MetricGauge label="Labour cost % of revenue" value={metrics?.labourPct ?? 0} target={25} hint="Wages ÷ sales" />
                <MetricGauge label="Food cost % of revenue" value={metrics?.foodCostPct ?? 0} target={32} hint="COGS ÷ sales" />
                <MetricGauge label="Net profit margin" value={metrics?.netMarginPct ?? 0} target={20} hint="Net ÷ sales" goodBelow={false} />
              </>)}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">Revenue through the day</CardTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {locationName(locationId)} · peak at {peak.hour} ({gbp(peak.revenue)})
                </p>
              </div>
              <Badge variant="accent" className="gap-1">
                <ShoppingBag className="h-3 w-3" /> {kpis?.order_count ?? 'N/A'} orders
              </Badge>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? <ChartSkeleton height={240} /> : (
                <Suspense fallback={<ChartSkeleton height={240} />}>
                  <RevenueAreaChart data={revenue} />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Best sellers + order count */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Best sellers today</CardTitle>
              <Trophy className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                : sellers_.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                    i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground',
                  )}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{s.name}</span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{gbp(s.revenue)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${(s.revenue / maxSellerRev) * 100}%` }} />
                      </div>
                      <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">{s.qty} sold</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="flex flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Orders today</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-brand-cyanText">
                  <ShoppingBag className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold tabular-nums">{loading ? '…' : (kpis?.order_count ?? 0)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Across all dayparts</p>
            </Card>
            <Card className="flex flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Avg order value</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold tabular-nums">
                {loading ? '…' : gbp(kpis?.avgOrderValue ?? 0, { decimals: 2 })}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Revenue ÷ orders</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
