import { useMemo, useState } from 'react'
import { Search, Eye, CreditCard, Banknote, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { PLATFORM_BY_CHANNEL, PLATFORMS } from '@/data/mockData'
import { ROLES } from '@/config/roles'
import { gbp, cn } from '@/lib/utils'
import { useVirtualRows } from '@/lib/useVirtualRows'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const DATE_RANGES = ['Today', 'Yesterday', 'Last 7 days']
const PAYMENTS = ['All', 'Card', 'Cash']
const CHANNELS = ['All channels', 'In-store', 'Website', 'Just Eat', 'Uber Eats', 'Deliveroo', 'Foodhub']
const PLATFORM_COLOR = Object.fromEntries(PLATFORMS.map((p) => [p.name, p.color]))

function ChannelTag({ channel }) {
  const color = PLATFORM_COLOR[channel]
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color || 'hsl(var(--muted-foreground))' }} />
      {channel}
    </span>
  )
}

const ROW_HEIGHT = 48
const VIEWPORT = 560

export default function Orders() {
  const { locationId, role } = useApp()
  const isStaff = role === ROLES.STAFF
  const showLocation = locationId === 'all'

  const [dateRange, setDateRange] = useState('Today')
  const [payment, setPayment] = useState('All')
  const [channel, setChannel] = useState('All channels')
  const [query, setQuery] = useState('')

  const { data: orders, loading, error } = useQuery(
    () => db.fetchOrders(locationId),
    [locationId],
  )
  const allOrders = orders || []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allOrders.filter((o) => {
      if (payment !== 'All' && o.payment !== payment) return false
      if (channel !== 'All channels' && o.channel !== channel) return false
      if (q && !`${o.id} ${o.items}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [allOrders, payment, channel, query])

  const summary = useMemo(() => {
    const total = filtered.reduce((s, o) => s + o.total, 0)
    const cardCount = filtered.reduce((s, o) => s + (o.payment === 'Card' ? 1 : 0), 0)
    return {
      total,
      count: filtered.length,
      avg: filtered.length ? total / filtered.length : 0,
      cardShare: filtered.length ? Math.round((cardCount / filtered.length) * 100) : 0,
    }
  }, [filtered])

  const { start, end, onScroll, topPad, bottomPad } = useVirtualRows({
    rowCount: filtered.length,
    rowHeight: ROW_HEIGHT,
    viewportHeight: VIEWPORT,
  })
  const visibleRows = filtered.slice(start, end)
  const colCount = showLocation ? 8 : 7

  return (
    <div>
      <PageHeader title="Orders" description="EPOS order feed">
        {isStaff && (
          <Badge variant="secondary" className="gap-1.5">
            <Eye className="h-3.5 w-3.5 text-brand-cyanText" /> View only
          </Badge>
        )}
      </PageHeader>

      <div className="space-y-4 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border bg-card p-0.5">
              {DATE_RANGES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors ' +
                    (dateRange === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')
                  }
                >
                  {d}
                </button>
              ))}
            </div>
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="h-9 rounded-lg border bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="h-9 rounded-lg border bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-cyanText" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order # or item…"
              className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
            />
          </div>
        </div>

        {/* Summary strip */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-12 w-full" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-6"><div className="text-xs text-muted-foreground">Orders shown</div><div className="mt-1 text-xl font-bold tabular-nums">{summary.count}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Total value</div><div className="mt-1 text-xl font-bold tabular-nums">{gbp(summary.total, { decimals: 2 })}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Avg order</div><div className="mt-1 text-xl font-bold tabular-nums">{gbp(summary.avg, { decimals: 2 })}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Card share</div><div className="mt-1 text-xl font-bold tabular-nums">{summary.cardShare}%</div></Card>
          </div>
        )}

        <Card className="overflow-hidden p-0">
          <div className="overflow-auto" style={{ maxHeight: VIEWPORT }} onScroll={onScroll}>
            <table className="w-full caption-bottom text-sm">
              <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
                <tr>
                  <th className="h-10 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order #</th>
                  <th className="h-10 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</th>
                  {showLocation && <th className="h-10 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</th>}
                  <th className="h-10 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</th>
                  <th className="h-10 px-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qty</th>
                  <th className="h-10 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</th>
                  <th className="h-10 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channel</th>
                  <th className="h-10 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={colCount} className="p-4"><div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div></td></tr>
                ) : (<>
                  {topPad > 0 && <tr style={{ height: topPad }} aria-hidden><td colSpan={colCount} /></tr>}
                  {visibleRows.map((o) => (
                    <tr key={`${o.location}-${o.id}`} className="border-b transition-colors hover:bg-muted/40" style={{ height: ROW_HEIGHT }}>
                      <td className="px-4 font-semibold">{o.id}</td>
                      <td className="px-4 text-muted-foreground tabular-nums">{o.time}</td>
                      {showLocation && <td className="px-4 text-muted-foreground">{o.location}</td>}
                      <td className="max-w-[320px] truncate px-4 whitespace-nowrap">{o.items}</td>
                      <td className="px-4 text-center tabular-nums">{o.qty}</td>
                      <td className="px-4">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          {o.payment === 'Card' ? <CreditCard className="h-3.5 w-3.5 text-brand-cyanText" /> : <Banknote className="h-3.5 w-3.5 text-brand-cyanText" />}
                          {o.payment}
                        </span>
                      </td>
                      <td className="px-4"><ChannelTag channel={o.channel} /></td>
                      <td className="px-4 text-right font-semibold tabular-nums">{gbp(o.total, { decimals: 2 })}</td>
                    </tr>
                  ))}
                  {bottomPad > 0 && <tr style={{ height: bottomPad }} aria-hidden><td colSpan={colCount} /></tr>}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={colCount} className="py-10 text-center text-muted-foreground">No orders match your filters.</td></tr>
                  )}
                </>)}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-xs text-muted-foreground">
          Showing {summary.count.toLocaleString()} orders · only the rows on screen are rendered (virtualised).
        </p>
      </div>
    </div>
  )
}
