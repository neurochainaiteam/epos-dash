import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles, Lightbulb, AlertTriangle, ArrowRight,
  PackageX, TrendingDown, TrendingUp, Percent, Users2, Trash2, ShoppingBag,
  Utensils, Clock, CalendarOff, AlertCircle,
  CloudRain, CalendarHeart, Sun, Cloud, Brain, Gauge,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { buildRecommendations } from '@/lib/recommendations'
import { buildForecast } from '@/lib/forecasting'
import { locationName } from '@/data/mockData'
import { gbp, cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const ICONS = {
  PackageX, TrendingDown, TrendingUp, Percent, Users2, Trash2, ShoppingBag,
  Sparkles, Utensils, Clock, CalendarOff,
}

const CALLOUT_ICONS = { TrendingUp, TrendingDown, CloudRain, CalendarHeart }
const WEATHER_ICONS = { sun: Sun, cloud: Cloud, rain: CloudRain }

const LEVEL_STYLE = {
  busy:   { bar: 'bg-brand-gradient', glow: 'shadow-glow-cyan', label: 'Busy',    dot: 'bg-brand-cyan' },
  quiet:  { bar: 'bg-muted-foreground/40', glow: '', label: 'Quiet',   dot: 'bg-muted-foreground/50' },
  normal: { bar: 'bg-brand-cyan/70', glow: '', label: 'Typical', dot: 'bg-brand-cyan/70' },
}

function InsightCard({ card }) {
  const Icon = ICONS[card.icon] || Sparkles
  return (
    <Card className="flex flex-col border-border/70 transition-all hover:border-brand-cyan/40 hover:shadow-glow-cyan">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 ring-1 ring-brand-cyan/25">
          <Icon className="h-[22px] w-[22px] text-brand-cyan" />
        </span>
        <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {card.category}
        </span>
      </div>

      <h3 className={cn('mt-4 text-[15px] font-bold leading-snug tracking-tight', card.type === 'watch' ? 'rec-title' : 'text-foreground')}>{card.title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-foreground/80">{card.insight}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {card.data.map((d) => (
          <div key={d.label} className="rounded-lg border border-border/60 bg-background/50 px-2.5 py-2">
            <div className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{d.label}</div>
            <div className="mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground">{d.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand-cyan/20 bg-brand-cyan/5 px-3 py-2.5">
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
        <span className="text-sm font-medium text-foreground">{card.action}</span>
      </div>
    </Card>
  )
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-brand-cyan" />{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums text-brand-cyan">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  )
}

export default function Recommendations() {
  const { locationId } = useApp()

  const { data: snap,            loading: l1, error: e1 } = useQuery(() => db.fetchDailySnapshot(locationId),     [locationId])
  const { data: bestSellers,     loading: l2, error: e2 } = useQuery(() => db.fetchBestSellers(locationId),       [locationId])
  const { data: recipes,         loading: l3, error: e3 } = useQuery(() => db.fetchRecipes(locationId),           [locationId])
  const { data: inventory,       loading: l4, error: e4 } = useQuery(() => db.fetchInventory(locationId),         [locationId])
  const { data: byDay,           loading: l5, error: e5 } = useQuery(() => db.fetchRevenueByDay(locationId),      [locationId])
  const { data: labourTrend,     loading: l6, error: e6 } = useQuery(() => db.fetchLabourTrend(locationId),       [locationId])
  const { data: waste,           loading: l7, error: e7 } = useQuery(() => db.fetchWaste(locationId),             [locationId])
  const { data: ingredientTrends,loading: l8, error: e8 } = useQuery(() => db.fetchIngredientTrends(locationId),  [locationId])
  const { data: orderModifiers,  loading: l9, error: e9 } = useQuery(() => db.fetchOrderModifiers(locationId),    [locationId])
  const { data: clockIns,        loading: l10,error: e10} = useQuery(() => db.fetchClockIns(locationId),          [locationId])
  const { data: holidays,        loading: l11,error: e11} = useQuery(() => db.fetchHolidays(locationId),          [locationId])
  const { data: staff,           loading: l12,error: e12} = useQuery(() => db.fetchStaff(locationId),             [locationId])

  const loading = l1||l2||l3||l4||l5||l6||l7||l8||l9||l10||l11||l12
  const error   = e1||e2||e3||e4||e5||e6||e7||e8||e9||e10||e11||e12

  const cards = useMemo(() => {
    if (loading || error) return []
    return buildRecommendations({
      snap, bestSellers, recipes, inventory, byDay, labourTrend, waste,
      ingredientTrends, orderModifiers, clockIns, holidays,
    })
  }, [loading, error, snap, bestSellers, recipes, inventory, byDay, labourTrend, waste, ingredientTrends, orderModifiers, clockIns, holidays])

  const counts = useMemo(() => ({
    opportunities: cards.filter((c) => c.type === 'opportunity').length,
    warnings: cards.filter((c) => c.type === 'watch').length,
  }), [cards])

  const shownCards = cards.slice(0, 6)

  // ---- Demand forecast (merged from the former Forecasting page) ----------
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

  const maxRev = fc ? Math.max(...fc.daily.map((d) => d.high)) : 0
  const runOutSoon = fc ? fc.inventoryForecast.filter((i) => i.runOutDate).slice(0, 6) : []

  return (
    <div>
      <PageHeader
        title="Recommendations"
        description="Your smart business advisor: insights generated from this branch's live numbers"
      >
        {loading ? <Skeleton className="h-6 w-24" /> : (
          <Badge variant="accent" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> {cards.length} insights
          </Badge>
        )}
      </PageHeader>

      <div className="space-y-6 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <Card className="relative overflow-hidden border-brand-cyan/20 p-6">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-violet text-brand-cyan shadow-glow-cyan">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">For {locationName(locationId)}</div>
                {loading ? <Skeleton className="mt-1 h-6 w-48" /> : (
                  <div className="text-xl font-bold text-foreground">
                    <span className="text-brand-cyan">{counts.opportunities} opportunities</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="rec-title">{counts.warnings} things to watch</span>
                  </div>
                )}
              </div>
            </div>
            {!loading && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-brand-cyan/25 bg-brand-cyan/5 px-3 py-2">
                  <Lightbulb className="h-4 w-4 text-brand-cyan" />
                  <span className="text-sm font-semibold tabular-nums text-foreground">{counts.opportunities}</span>
                  <span className="text-xs text-muted-foreground">to act on</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/40 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-semibold tabular-nums text-foreground">{counts.warnings}</span>
                  <span className="text-xs text-muted-foreground">to watch</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6"><Skeleton className="h-48 w-full" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shownCards.map((card) => <InsightCard key={card.id} card={card} />)}
          </div>
        )}

        {!loading && cards.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">
            Everything looks healthy at {locationName(locationId)}, no flags right now.
          </Card>
        )}

        {/* ---- Demand Forecast (merged from the former Forecasting page) ---- */}
        <div className="flex items-center gap-3 pt-2">
          <h2 className="shrink-0 text-lg font-bold text-brand-cyan">Demand Forecast</h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        {loading || !fc ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            <Card className="relative overflow-hidden border-brand-cyan/20 p-6">
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-violet text-brand-cyan shadow-glow-cyan">
                    <Brain className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">Forecast for {locationName(locationId)} · next 7 days</div>
                    <div className="text-xl font-bold text-foreground">
                      <span className="text-brand-cyan">{fc.summary.next7Orders.toLocaleString()} orders</span>
                      <span className="text-muted-foreground"> · </span>
                      <span className="text-foreground">{gbp(fc.summary.next7Revenue)}</span>
                      <span className="text-muted-foreground"> projected</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1.5"><Gauge className="h-3.5 w-3.5" /> {fc.summary.confidence}% confidence</Badge>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={ShoppingBag} label="Predicted orders (7d)" value={fc.summary.next7Orders.toLocaleString()} sub="vs typical week" />
              <StatCard icon={TrendingUp}  label="Predicted revenue (7d)" value={gbp(fc.summary.next7Revenue)} sub="net of VAT" />
              <StatCard icon={TrendingUp}  label="Busiest day" value={`${fc.summary.busiest?.dow} · +${fc.summary.busiest?.deltaPct}%`} sub={fc.summary.busiest?.date} />
              <StatCard icon={Users2}      label="Avg labour %" value={`${fc.summary.avgLabourPct}%`} sub={`target ≤ ${fc.summary.labourTarget}%`} />
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-cyan">Actionable prep callouts</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {fc.callouts.map((c) => {
                  const Icon = CALLOUT_ICONS[c.icon] || Sparkles
                  return (
                    <Card key={c.id} className="flex items-start gap-3 p-6">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet text-brand-cyan">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-sm font-bold text-warning">{c.title}</div>
                        <div className="mt-1 text-sm leading-relaxed text-foreground/80">{c.detail}</div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-brand-cyan">Demand forecast · next 14 days</h2>
                  <p className="text-xs text-muted-foreground">Predicted revenue per day. Busy days highlighted, weekends marked</p>
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
                        className={cn('w-full rounded-md transition-all', s.bar, s.glow, d.weekend && 'ring-1 ring-foreground/20')}
                        style={{ height: h }}
                        title={`${d.date}: ~${d.predictedOrders} orders · ${gbp(d.predictedRevenue)} (${d.deltaPct >= 0 ? '+' : ''}${d.deltaPct}%)`}
                      />
                      <W className={cn('h-3.5 w-3.5', d.weather.icon === 'rain' ? 'text-brand-cyan' : 'text-muted-foreground')} />
                      <div className="text-center leading-tight">
                        <div className="text-[10px] font-semibold text-foreground">{d.dow}</div>
                        <div className="text-[9px] text-muted-foreground">{d.date.split(' ')[1]}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <PackageX className="h-4 w-4 text-brand-cyan" />
                  <h2 className="text-base font-bold text-brand-cyan">Inventory forecast</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Predicted usage & run-out dates for the items running down fastest</p>
                <div className="mt-4 space-y-2">
                  {runOutSoon.map((it) => (
                    <div key={it.name} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{it.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.inStock} {it.unit} left · ~{it.dailyUsage}/day · {it.supplier}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-destructive">
                          {it.runOutDate ? `Out by ${it.runOutDate.split(' ').slice(1).join(' ')}` : '> 2 weeks'}
                        </div>
                        <div className="text-xs text-brand-cyan">Order ~{it.suggestedQty} {it.unit}</div>
                      </div>
                    </div>
                  ))}
                  {runOutSoon.length === 0 && <p className="text-sm text-muted-foreground">No items forecast to run out in the next 14 days.</p>}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-brand-cyan" />
                  <h2 className="text-base font-bold text-brand-cyan">Staffing suggestions</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Recommended team per day to meet demand and hold labour ≤ {fc.summary.labourTarget}%</p>
                <div className="mt-4 space-y-1.5">
                  {fc.staffing.map((s) => (
                    <div key={s.date} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40">
                      <div className="w-24 shrink-0">
                        <div className="text-sm font-semibold text-foreground">{s.dow}</div>
                        <div className="text-[10px] text-muted-foreground">{s.date.split(' ').slice(1).join(' ')}</div>
                      </div>
                      <div className="flex flex-1 items-center gap-1">
                        {Array.from({ length: s.recommendedStaff }).map((_, idx) => (
                          <span key={idx} className="h-5 w-2 rounded-sm bg-brand-gradient" />
                        ))}
                        <span className="ml-2 text-sm font-semibold tabular-nums text-foreground">{s.recommendedStaff}</span>
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
                <Card className="flex items-start gap-3 p-6">
                  <CloudRain className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">Seasonal factor, {rain.dow} {rain.date.split(' ').slice(1).join(' ')}:</span>{' '}
                    <span className="text-foreground/80">{rain.note}. We've already factored this into the demand and staffing figures above.</span>
                  </div>
                </Card>
              )
            })()}

            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5" />
              Rule-based projection over live history, ready to swap in a trained forecasting model. Data-retention target: up to 3 years.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
