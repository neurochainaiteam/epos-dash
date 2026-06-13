import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles, TrendingUp, TrendingDown, CloudRain, CalendarHeart, Sun, Cloud,
  Users2, PackageX, ArrowRight, Brain, Gauge, ShoppingBag, AlertCircle,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { buildForecast } from '@/lib/forecasting'
import { locationName } from '@/data/mockData'
import { gbp, cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const CALLOUT_ICONS = { TrendingUp, TrendingDown, CloudRain, CalendarHeart }
const WEATHER_ICONS = { sun: Sun, cloud: Cloud, rain: CloudRain }

const LEVEL_STYLE = {
  busy:   { bar: 'bg-brand-gradient', glow: 'shadow-glow-cyan', label: 'Busy',    dot: 'bg-brand-cyan' },
  quiet:  { bar: 'bg-muted-foreground/40', glow: '', label: 'Quiet',   dot: 'bg-muted-foreground/50' },
  normal: { bar: 'bg-brand-cyan/70', glow: '', label: 'Typical', dot: 'bg-brand-cyan/70' },
}

const CALLOUT_TONE = {
  busy:    'border-brand-cyan/30 bg-brand-cyan/5',
  quiet:   'border-border/70 bg-background/40',
  weather: 'border-brand-cyan/30 bg-brand-cyan/5',
  event:   'border-brand-magenta/30 bg-brand-magenta/5',
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-brand-cyan" />{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums text-[#E1E1E1]">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  )
}

export default function Forecasting() {
  const { locationId } = useApp()

  const { data: snap,      loading: l1, error: e1 } = useQuery(() => db.fetchDailySnapshot(locationId), [locationId])
  const { data: byDay,     loading: l2, error: e2 } = useQuery(() => db.fetchRevenueByDay(locationId),  [locationId])
  const { data: inventory, loading: l3, error: e3 } = useQuery(() => db.fetchInventory(locationId),     [locationId])
  const { data: staff,     loading: l4, error: e4 } = useQuery(() => db.fetchStaff(locationId),         [locationId])

  const loading = l1 || l2 || l3 || l4
  const error   = e1 || e2 || e3 || e4

  // Supplier lookup: fetch lazily for unique supplier names in the inventory list.
  const [supplierMap, setSupplierMap] = useState({})
  useEffect(() => {
    if (!inventory?.length) return
    const names = [...new Set(inventory.map((i) => i.supplier).filter(Boolean))]
    names.forEach(async (name) => {
      if (supplierMap[name]) return
      const { data } = await db.fetchSupplier(name)
      if (data) setSupplierMap((prev) => ({ ...prev, [name]: data }))
    })
  }, [inventory])

  const fc = useMemo(() => {
    if (loading || error) return null
    return buildForecast({ snap, byDay: byDay || [], inventory: inventory || [], staff: staff || [], supplierMap })
  }, [loading, error, snap, byDay, inventory, staff, supplierMap])

  if (!fc && loading) {
    return (
      <div>
        <PageHeader title="Demand Forecasting" description="14-day predictive outlook from your sales patterns, weather and local events">
          <Badge variant="accent" className="gap-1.5"><Brain className="h-3.5 w-3.5" /> Predictive</Badge>
        </PageHeader>
        <div className="space-y-4 p-5 sm:p-8">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !fc) {
    return (
      <div>
        <PageHeader title="Demand Forecasting" description="14-day predictive outlook from your sales patterns, weather and local events" />
        <div className="p-5 sm:p-8">
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error || 'Failed to load forecast data.'}
          </div>
        </div>
      </div>
    )
  }

  const maxRev = Math.max(...fc.daily.map((d) => d.high))
  const runOutSoon = fc.inventoryForecast.filter((i) => i.runOutDate).slice(0, 6)

  return (
    <div>
      <PageHeader
        title="Demand Forecasting"
        description="14-day predictive outlook from your sales patterns, weather and local events"
      >
        <Badge variant="accent" className="gap-1.5"><Brain className="h-3.5 w-3.5" /> Predictive</Badge>
        <Badge variant="secondary" className="gap-1.5"><Gauge className="h-3.5 w-3.5" /> {fc.summary.confidence}% confidence</Badge>
      </PageHeader>

      <div className="space-y-6 p-5 sm:p-8">
        <Card className="relative overflow-hidden border-brand-cyan/20 p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-magenta/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-24 h-48 w-48 rounded-full bg-brand-cyan/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow-cyan">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">Forecast for {locationName(locationId)} · next 7 days</div>
                <div className="text-xl font-bold text-[#E1E1E1]">
                  <span className="text-brand-cyan">{fc.summary.next7Orders.toLocaleString()} orders</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="rec-title">{gbp(fc.summary.next7Revenue)}</span>
                  <span className="text-muted-foreground"> projected</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Busiest <span className="font-semibold text-[#E1E1E1]">{fc.summary.busiest?.dow}</span> ·
              quietest <span className="font-semibold text-[#E1E1E1]">{fc.summary.quietest?.dow}</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={ShoppingBag} label="Predicted orders (7d)" value={fc.summary.next7Orders.toLocaleString()} sub="vs typical week" />
          <StatCard icon={TrendingUp}  label="Predicted revenue (7d)" value={gbp(fc.summary.next7Revenue)} sub="net of VAT" />
          <StatCard icon={TrendingUp}  label="Busiest day" value={`${fc.summary.busiest?.dow} · +${fc.summary.busiest?.deltaPct}%`} sub={fc.summary.busiest?.date} />
          <StatCard icon={Users2}      label="Avg labour %" value={`${fc.summary.avgLabourPct}%`} sub={`target ≤ ${fc.summary.labourTarget}%`} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Actionable prep callouts</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {fc.callouts.map((c) => {
              const Icon = CALLOUT_ICONS[c.icon] || Sparkles
              return (
                <Card key={c.id} className={cn('flex items-start gap-3 p-4', CALLOUT_TONE[c.type])}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 ring-1 ring-brand-cyan/25">
                    <Icon className="h-5 w-5 text-brand-cyan" />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-[#EF36F5]">{c.title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-[#E1E1E1]/85">{c.detail}</div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#E1E1E1]">Demand forecast · next 14 days</h2>
              <p className="text-xs text-muted-foreground">Predicted revenue per day — busy days highlighted, weekends marked</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-gradient" /> Busy</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-cyan/70" /> Typical</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Quiet</span>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-1.5 sm:gap-2.5" style={{ height: 220 }}>
            {fc.daily.map((d) => {
              const s = LEVEL_STYLE[d.level]
              const h = Math.max(6, (d.predictedRevenue / maxRev) * 180)
              const W = WEATHER_ICONS[d.weather.icon] || Cloud
              return (
                <div key={d.i} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="text-[10px] font-semibold tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {gbp(d.predictedRevenue)}
                  </div>
                  <div
                    className={cn('w-full rounded-md transition-all', s.bar, s.glow, d.weekend && 'ring-1 ring-brand-magenta/30')}
                    style={{ height: h }}
                    title={`${d.date}: ~${d.predictedOrders} orders · ${gbp(d.predictedRevenue)} (${d.deltaPct >= 0 ? '+' : ''}${d.deltaPct}%)`}
                  />
                  <W className={cn('h-3.5 w-3.5', d.weather.icon === 'rain' ? 'text-brand-cyan' : 'text-muted-foreground')} />
                  <div className="text-center leading-tight">
                    <div className="text-[10px] font-semibold text-[#E1E1E1]">{d.dow}</div>
                    <div className="text-[9px] text-muted-foreground">{d.date.split(' ')[1]}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <PackageX className="h-4 w-4 text-brand-cyan" />
              <h2 className="text-base font-bold text-[#E1E1E1]">Inventory forecast</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Predicted usage & run-out dates for the items running down fastest</p>
            <div className="mt-4 space-y-2">
              {runOutSoon.map((it) => (
                <div key={it.name} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#E1E1E1]">{it.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {it.inStock} {it.unit} left · ~{it.dailyUsage}/day · {it.supplier}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={cn('text-sm font-semibold', it.daysLeft <= 3 ? 'text-[#EF36F5]' : 'text-[#E1E1E1]')}>
                      {it.runOutDate ? `Out by ${it.runOutDate.split(' ').slice(1).join(' ')}` : '> 2 weeks'}
                    </div>
                    <div className="text-xs text-brand-cyan">Order ~{it.suggestedQty} {it.unit}</div>
                  </div>
                </div>
              ))}
              {runOutSoon.length === 0 && <p className="text-sm text-muted-foreground">No items forecast to run out in the next 14 days.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4 text-brand-cyan" />
              <h2 className="text-base font-bold text-[#E1E1E1]">Staffing suggestions</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Recommended team per day to meet demand and hold labour ≤ {fc.summary.labourTarget}%</p>
            <div className="mt-4 space-y-1.5">
              {fc.staffing.map((s) => (
                <div key={s.date} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40">
                  <div className="w-24 shrink-0">
                    <div className="text-sm font-semibold text-[#E1E1E1]">{s.dow}</div>
                    <div className="text-[10px] text-muted-foreground">{s.date.split(' ').slice(1).join(' ')}</div>
                  </div>
                  <div className="flex flex-1 items-center gap-1">
                    {Array.from({ length: s.recommendedStaff }).map((_, idx) => (
                      <span key={idx} className="h-5 w-2 rounded-sm bg-brand-gradient" />
                    ))}
                    <span className="ml-2 text-sm font-semibold tabular-nums text-[#E1E1E1]">{s.recommendedStaff}</span>
                    <span className="text-xs text-muted-foreground">staff · ~{s.predictedOrders} orders</span>
                  </div>
                  <Badge variant={s.status === 'high' ? 'warning' : 'success'}>{s.labourPct}% labour</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {(() => {
          const rain = fc.weather.find((w) => w.icon === 'rain' && w.demandFactor >= 1.1)
          if (!rain) return null
          return (
            <Card className="flex items-start gap-3 border-brand-cyan/25 bg-brand-cyan/5 p-4">
              <CloudRain className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
              <div className="text-sm">
                <span className="font-semibold text-[#E1E1E1]">Seasonal factor — {rain.dow} {rain.date.split(' ').slice(1).join(' ')}:</span>{' '}
                <span className="text-[#E1E1E1]/85">{rain.note}. We've already factored this into the demand and staffing figures above.</span>
              </div>
            </Card>
          )
        })()}

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
          Rule-based projection over live history — ready to swap in a trained forecasting model. Data-retention target: up to 3 years.
        </p>
      </div>
    </div>
  )
}
