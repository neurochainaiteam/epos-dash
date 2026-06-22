import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useEffect } from 'react'
import { Download, ChevronDown, FileText, Image as ImageIcon, Loader2, Calendar, Trash2, Database, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { locationName, TODAY_LABEL } from '@/data/mockData'
import { gbp, pct, cn } from '@/lib/utils'
import { exportAnalytics } from '@/lib/exportAnalytics'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ChartSkeleton from '@/components/charts/ChartSkeleton'

const AnalyticsCharts = lazy(() => import('@/components/charts/AnalyticsCharts'))

const FILE_DATE = TODAY_LABEL.split(' ').slice(1).join('-')

const FORMATS = [
  { key: 'pdf',  label: 'PDF document', icon: FileText },
  { key: 'png',  label: 'PNG image',    icon: ImageIcon },
  { key: 'jpeg', label: 'JPEG image',   icon: ImageIcon },
]

const RANGES = [
  { key: 'today',  label: 'Today',        days: 1   },
  { key: '7d',     label: 'Last 7 days',  days: 7   },
  { key: '30d',    label: 'Last 30 days', days: 30  },
  { key: '90d',    label: 'Last 90 days', days: 90  },
  { key: 'ytd',    label: 'Year to date', days: 161 },
  { key: 'custom', label: 'Custom',       days: null },
]

function RangeSelector({ range, setRange, custom, setCustom }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  const active = RANGES.find((r) => r.key === range)
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
        <Calendar className="h-4 w-4 text-brand-cyanText" /> {active?.label}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-60 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg animate-fade-in">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date range</div>
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => { setRange(r.key); if (r.key !== 'custom') setOpen(false) }}
              className={cn('flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent', range === r.key && 'bg-accent/60 text-brand-cyanText')}>
              {r.label}
            </button>
          ))}
          {range === 'custom' && (
            <div className="space-y-2 border-t border-border/60 p-2.5">
              <label className="block text-[11px] font-medium text-muted-foreground">From
                <input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-sm text-foreground" />
              </label>
              <label className="block text-[11px] font-medium text-muted-foreground">To
                <input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-sm text-foreground" />
              </label>
            </div>
          )}
          <div className="flex items-start gap-1.5 border-t border-border/60 px-2.5 py-2 text-[10px] text-muted-foreground">
            <Database className="mt-0.5 h-3 w-3 shrink-0 text-brand-cyanText" /> Up to 3 years of history is retained for trend analysis.
          </div>
        </div>
      )}
    </div>
  )
}

function ExportMenu({ onExport, busy }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button type="button" disabled={busy} onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-glow-cyan transition-opacity hover:opacity-90 disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy ? 'Exporting…' : 'Export'}
        {!busy && <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />}
      </button>
      {open && !busy && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-48 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg animate-fade-in">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Download as</div>
          {FORMATS.map((f) => (
            <button key={f.key} onClick={() => { setOpen(false); onExport(f.key) }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent">
              <f.icon className="h-4 w-4 text-brand-cyanText" /> {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Analytics() {
  const { locationId } = useApp()
  const captureRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [range, setRange] = useState('7d')
  const [custom, setCustom] = useState({ from: '2026-05-01', to: '2026-06-10' })

  const { data: byHour,   loading: l1, error: e1 } = useQuery(() => db.fetchHourlyRevenue(locationId),   [locationId])
  const { data: byDay,    loading: l2, error: e2 } = useQuery(() => db.fetchRevenueByDay(locationId),    [locationId])
  const { data: sellers,  loading: l3, error: e3 } = useQuery(() => db.fetchBestSellers(locationId),     [locationId])
  const { data: labour,   loading: l4, error: e4 } = useQuery(() => db.fetchLabourTrend(locationId),     [locationId])
  const { data: snap,     loading: l5, error: e5 } = useQuery(() => db.fetchDailySnapshot(locationId),   [locationId])
  const { data: waste,    loading: l6, error: e6 } = useQuery(() => db.fetchWaste(locationId),           [locationId])

  const loading = l1 || l2 || l3 || l4 || l5 || l6
  const error   = e1 || e2 || e3 || e4 || e5 || e6

  const hours   = byHour   || []
  const days    = byDay    || []
  const bestSellers = sellers || []
  const labourTrend = labour  || []
  const wasteList   = waste   || []

  const { peakHour, bestDay, avgLabourPct, wasteByRecipe } = useMemo(() => {
    const peakHour = hours.reduce((a, b) => (b.revenue > a.revenue ? b : a), hours[0] || { hour: 'N/A', revenue: 0 })
    const bestDay  = days.reduce((a, b)  => (b.revenue > a.revenue ? b : a), days[0]  || { day:  'N/A', revenue: 0 })
    const avgLabourPct = labourTrend.length
      ? labourTrend.reduce((s, d) => s + d.labourPct, 0) / labourTrend.length
      : 0

    const recipeMap = new Map()
    wasteList.forEach((w) => recipeMap.set(w.recipe, (recipeMap.get(w.recipe) || 0) + w.cost))
    const wasteByRecipe = [...recipeMap.entries()].sort((a, b) => b[1] - a[1]).map(([recipe, cost]) => ({ recipe, cost }))

    return { peakHour, bestDay, avgLabourPct, wasteByRecipe }
  }, [hours, days, labourTrend, wasteList])

  const rangeDays   = range === 'custom' ? 30 : (RANGES.find((r) => r.key === range)?.days || 7)
  const rangeLabel  = range === 'custom' ? `${custom.from} → ${custom.to}` : RANGES.find((r) => r.key === range)?.label
  const rangeRevenue = (snap?.revenue ?? 0) * rangeDays
  const rangeOrders  = (snap?.order_count ?? 0) * rangeDays
  const maxWaste     = Math.max(1, ...wasteByRecipe.map((w) => w.cost))

  async function handleExport(format) {
    setBusy(true)
    try {
      await exportAnalytics({ format, node: captureRef.current, location: locationName(locationId), date: FILE_DATE })
    } catch (err) {
      console.error('Export failed', err)
    } finally { setBusy(false) }
  }

  return (
    <div>
      <PageHeader title="Analytics" description="Trends across trading">
        <RangeSelector range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
        <ExportMenu onExport={handleExport} busy={busy} />
      </PageHeader>

      <div ref={captureRef} className="space-y-5 bg-background p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <Card className="flex flex-wrap items-center justify-between gap-3 border-brand-cyan/20 p-6">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-brand-cyanText" />
            <span className="text-muted-foreground">Showing</span>
            <span className="font-semibold text-foreground">{rangeLabel}</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div><span className="text-muted-foreground">Revenue </span><span className="font-bold tabular-nums text-foreground">{gbp(rangeRevenue)}</span></div>
            <div><span className="text-muted-foreground">Orders </span><span className="font-bold tabular-nums text-foreground">{rangeOrders.toLocaleString()}</span></div>
          </div>
        </Card>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-12 w-full" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-6"><div className="text-xs text-muted-foreground">Peak hour</div><div className="mt-1 text-xl font-bold">{peakHour.hour}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Best day</div><div className="mt-1 text-xl font-bold">{bestDay.day} · {gbp(bestDay.revenue)}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Top seller</div><div className="mt-1 truncate text-base font-bold">{bestSellers[0]?.name ?? 'N/A'}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Avg labour %</div><div className="mt-1 text-xl font-bold tabular-nums">{pct(avgLabourPct)}</div></Card>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <Card key={i} className="p-6"><ChartSkeleton height={240} /></Card>)}
          </div>
        ) : (
          <Suspense fallback={<div className="grid gap-4 lg:grid-cols-2">{[0,1,2,3].map((i) => <Card key={i} className="p-6"><ChartSkeleton height={240} /></Card>)}</div>}>
            <AnalyticsCharts byHour={hours} byDay={days} bestSellers={bestSellers} labourTrend={labourTrend} peakHour={peakHour} />
          </Suspense>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-brand-cyanText" />
            <h2 className="text-base font-bold text-foreground">Waste cost by menu item</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Where logged waste is costing you the most, attributed per dish</p>
          {loading ? <Skeleton className="mt-4 h-40 w-full" /> : (
            <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {wasteByRecipe.map((w) => (
                <div key={w.recipe}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2 text-foreground/85">{w.recipe}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">{gbp(w.cost, { decimals: 2 })}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(w.cost / maxWaste) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
