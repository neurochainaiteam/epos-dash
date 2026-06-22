import { useMemo, useState } from 'react'
import { Users, Phone, Clock, LayoutGrid, List, DoorOpen, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { getTables, locationName } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const statusVariant = { Confirmed: 'accent', Seated: 'success', Pending: 'warning', Cancelled: 'destructive' }

const STATE_STYLE = {
  free:     'border-border/70 bg-muted/30 text-muted-foreground',
  reserved: 'border-brand-cyan/50 bg-brand-cyan/15 text-brand-cyanText',
  seated:   'border-success/50 bg-success/15 text-success',
  pending:  'border-warning/50 bg-warning/15 text-warning',
}
const STATE_LABEL = { free: 'Free', reserved: 'Reserved', seated: 'Seated', pending: 'Pending' }

function FloorMap({ tables }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground"><DoorOpen className="h-4 w-4 text-brand-cyanText" /> Floor plan</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {Object.entries(STATE_LABEL).map(([k, label]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-full border', STATE_STYLE[k])} /> {label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-background/40" style={{ aspectRatio: '16 / 9' }}>
        <div className="absolute inset-x-0 top-0 flex h-7 items-center justify-center bg-sidebar/60 text-[10px] font-semibold uppercase tracking-wider text-white/80">
          Counter & kitchen
        </div>
        {tables.map((t) => (
          <div
            key={t.id}
            className={cn(
              'absolute flex flex-col items-center justify-center border-2 p-1 text-center shadow-sm transition-transform hover:scale-[1.03]',
              t.shape === 'round' ? 'rounded-full' : t.shape === 'rect' ? 'rounded-xl' : 'rounded-lg',
              STATE_STYLE[t.state],
            )}
            style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, height: `${t.h}%`, transform: 'translate(-50%, 0)' }}
            title={t.booking ? `${t.id} · ${t.booking.name} (${t.booking.size}) · ${t.booking.status}` : `${t.id} · free · ${t.seats} seats`}
          >
            <span className="text-xs font-bold leading-none">{t.id}</span>
            <span className="text-[9px] leading-tight opacity-80">{t.seats} seats</span>
            {t.booking && <span className="mt-0.5 max-w-full truncate text-[9px] font-medium leading-tight">{t.booking.time} · {t.booking.name.split(' ')[0]}</span>}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function Bookings() {
  const { locationId } = useApp()
  const [view, setView] = useState('list')

  const { data: bookings, loading, error } = useQuery(
    () => db.fetchBookings(locationId),
    [locationId],
  )
  const all = bookings || []

  // Floor map comes from mockData static config (layout positions don't change)
  // bookings are overlaid on top of the fixed table layout
  const tables = useMemo(() => {
    const staticTables = getTables(locationId)
    return staticTables.map((t) => {
      const booking = all.find((b) => b.table === t.id && b.status !== 'Cancelled')
      if (!booking) return t
      const state = booking.status === 'Seated' ? 'seated' : booking.status === 'Pending' ? 'pending' : 'reserved'
      return { ...t, state, booking }
    })
  }, [locationId, all])

  const covers     = all.reduce((s, b) => s + b.size, 0)
  const freeTables = tables.filter((t) => t.state === 'free').length

  return (
    <div>
      <PageHeader title="Bookings" description="Tonight's reservations & live table map">
        <div className="inline-flex rounded-lg border bg-card p-0.5">
          <button onClick={() => setView('list')} className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button onClick={() => setView('map')} className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', view === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <LayoutGrid className="h-3.5 w-3.5" /> Table map
          </button>
        </div>
      </PageHeader>

      <div className="space-y-4 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-12 w-full" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-6"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Reservations</div><div className="mt-1 text-xl font-bold tabular-nums">{all.length}</div></Card>
            <Card className="p-6"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />Total covers</div><div className="mt-1 text-xl font-bold tabular-nums">{covers}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Pending</div><div className="mt-1 text-xl font-bold tabular-nums">{all.filter((b) => b.status === 'Pending').length}</div></Card>
            <Card className="p-6"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><LayoutGrid className="h-3.5 w-3.5" />Free tables</div><div className="mt-1 text-xl font-bold tabular-nums">{freeTables}/{tables.length}</div></Card>
          </div>
        )}

        {view === 'map' ? (
          <>
            {locationId === 'all' && <p className="text-xs text-muted-foreground">Floor map shows {locationName('bham')}. Switch to a single location to see each branch's plan.</p>}
            <FloorMap tables={tables} />
          </>
        ) : (
          <Card>
            {loading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Time</TableHead>
                    {locationId === 'all' && <TableHead>Location</TableHead>}
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Party</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.map((b, idx) => (
                    <TableRow key={`${b.location}-${b.time}-${idx}`}>
                      <TableCell className="font-semibold tabular-nums">{b.time}</TableCell>
                      {locationId === 'all' && <TableCell className="text-muted-foreground">{b.location}</TableCell>}
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 tabular-nums"><Users className="h-3.5 w-3.5 text-muted-foreground" />{b.size}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{b.table}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{b.phone}</span>
                      </TableCell>
                      <TableCell className="text-right"><Badge variant={statusVariant[b.status] || 'secondary'}>{b.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
