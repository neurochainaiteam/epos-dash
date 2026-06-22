import { useMemo, useState } from 'react'
import { Info, Plane, Plus, X, Check, CalendarOff, AlertCircle, CalendarDays, CalendarRange } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { TIME_OFF_TYPES, WEEK_DAYS } from '@/data/mockData'
import { ROLES } from '@/config/roles'
import { gbp, cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

function weeklyHours(staff) {
  return WEEK_DAYS.filter((d) => staff.shifts?.[d]).length * 7
}

// Mon-start weekday index for a JS Date, matching WEEK_DAYS ordering.
function weekdayOf(date) {
  return WEEK_DAYS[(date.getDay() + 6) % 7]
}

function monthGrid(year, month) {
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export default function Staff() {
  const { locationId, role, session } = useApp()
  const isStaff = role === ROLES.STAFF
  const myName = session?.user?.user_metadata?.name
  const [calendarView, setCalendarView] = useState('week')

  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: staff, loading: staffLoading } = useQuery(
    () => db.fetchStaff(locationId),
    [locationId],
  )
  const { data: timeOff, loading: toLoading, error, refetch } = useQuery(
    () => db.fetchTimeOff(locationId),
    [locationId],
  )

  const all       = staff   || []
  const allTimeOff = timeOff || []
  const loading    = staffLoading || toLoading

  const { weeklyWageBill, avgWage } = useMemo(() => ({
    weeklyWageBill: all.reduce((s, p) => s + weeklyHours(p) * p.wage, 0),
    avgWage: all.length ? all.reduce((s, p) => s + p.wage, 0) / all.length : 0,
  }), [all])

  const offByName = useMemo(() => {
    const m = new Map()
    for (const t of allTimeOff) {
      const arr = m.get(t.name) || []
      arr.push(t)
      m.set(t.name, arr)
    }
    return m
  }, [allTimeOff])

  function offForDay(name, day) {
    const entries = offByName.get(name) || []
    return entries.find((e) => (e.weekDays || []).includes(day))
  }

  // Approved/working = green · Pending = amber · sick/holiday/absent/not on = red.
  function dayStatus(p, day) {
    const off = offForDay(p.name, day)
    if (off) {
      if (off.status === 'Pending') return 'amber'
      if (off.type === 'Training') return 'green'
      return 'red'
    }
    return p.shifts?.[day] ? 'green' : 'red'
  }

  const weekdayCounts = useMemo(() => {
    const m = {}
    for (const d of WEEK_DAYS) {
      const c = { green: 0, amber: 0, red: 0 }
      for (const p of all) c[dayStatus(p, d)]++
      m[d] = c
    }
    return m
  }, [all, offByName])

  const today = new Date()
  const grid = useMemo(() => monthGrid(today.getFullYear(), today.getMonth()), [])

  async function saveBooking() {
    if (!form.name || form.weekDays.length === 0) return
    setSaving(true)
    const entry = {
      name:     form.name,
      role:     all.find((s) => s.name === form.name)?.role || '',
      type:     form.type,
      status:   form.status,
      label:    form.weekDays.join(', '),
      weekDays: form.weekDays,
      days:     form.weekDays.length,
    }
    await db.insertTimeOff(locationId, entry)
    setSaving(false)
    setForm(null)
    refetch()
  }

  return (
    <div>
      <PageHeader title="Staff & Schedule" description="Team, rota & time-off">
        <Badge variant="secondary">Week of 8 to 14 Jun</Badge>
        <Button size="sm" onClick={() => setForm({ name: all[0]?.name || '', type: 'Holiday', status: 'Pending', weekDays: [] })}>
          <Plus className="h-3.5 w-3.5" /> Book time off
        </Button>
      </PageHeader>

      <div className="space-y-4 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* ---- Team KPIs ---- */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-12 w-full" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-6"><div className="text-xs text-muted-foreground">Team size</div><div className="mt-1 text-xl font-bold tabular-nums text-brand-cyanText">{all.length}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Avg hourly</div><div className="mt-1 text-xl font-bold tabular-nums text-brand-cyanText">{gbp(avgWage, { decimals: 2 })}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Est. weekly wage bill</div><div className="mt-1 text-xl font-bold tabular-nums text-brand-cyanText">{gbp(weeklyWageBill)}</div></Card>
            <Card className="p-6"><div className="text-xs text-muted-foreground">Full-time</div><div className="mt-1 text-xl font-bold tabular-nums text-brand-cyanText">{all.filter((s) => s.contract === 'Full-time').length}</div></Card>
          </div>
        )}

        {isStaff && (
          <Card className="flex items-center gap-2.5 border-primary/30 p-6 text-sm">
            <Info className="h-4 w-4 shrink-0 text-brand-cyanText" />
            <span>Your shifts are highlighted below. Holidays and time-off show on the rota in colour.</span>
          </Card>
        )}

        {/* ---- Calendar: week/month rota ---- */}
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-brand-cyanText">
              <CalendarDays className="h-4 w-4" /> Calendar
            </h2>
            <div className="inline-flex rounded-lg border bg-card p-0.5">
              <button
                onClick={() => setCalendarView('week')}
                className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', calendarView === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                Week
              </button>
              <button
                onClick={() => setCalendarView('month')}
                className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', calendarView === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                Month
              </button>
            </div>
          </div>

          {loading ? <Skeleton className="h-64 w-full" /> : calendarView === 'week' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team member</th>
                    {WEEK_DAYS.map((d) => (
                      <th key={d} className="min-w-[110px] px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {all.map((p) => {
                    const mine = p.name === myName
                    return (
                      <tr key={p.name} className={cn('border-b', mine && 'bg-accent/30')}>
                        <td className={cn('sticky left-0 z-10 bg-card px-4 py-3', mine && 'bg-accent/30')}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.name}</span>
                            {mine && <Badge variant="default" className="text-[10px]">You</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{p.role}</div>
                        </td>
                        {WEEK_DAYS.map((d) => {
                          const off = offForDay(p.name, d)
                          return (
                            <td key={d} className="px-2 py-2 text-center">
                              {off ? (
                                <Badge
                                  variant={off.status === 'Pending' ? 'warning' : off.type === 'Training' ? 'success' : 'destructive'}
                                  className={cn('w-full justify-center gap-1', off.status === 'Pending' && 'opacity-70 ring-1 ring-dashed')}
                                  title={`${off.type} · ${off.status}`}
                                >
                                  <CalendarOff className="h-3 w-3" />{off.type}
                                </Badge>
                              ) : p.shifts?.[d] ? (
                                <Badge variant="success" className="w-full justify-center tabular-nums">{p.shifts[d]}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground/40">Off</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5 text-brand-cyanText" />
                {today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} · staff coverage by weekday pattern
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEK_DAYS.map((d) => (
                  <div key={d} className="px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
                ))}
                {grid.flat().map((date, i) => {
                  if (!date) return <div key={i} className="rounded-lg bg-muted/20" style={{ minHeight: 64 }} />
                  const d = weekdayOf(date)
                  const c = weekdayCounts[d]
                  const isToday = date.toDateString() === today.toDateString()
                  return (
                    <div key={i} className={cn('rounded-lg border border-border/60 p-2', isToday && 'border-brand-cyan/50 ring-1 ring-brand-cyan/30')} style={{ minHeight: 64 }}>
                      <div className="text-xs font-semibold text-foreground">{date.getDate()}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold tabular-nums">
                        <span className="flex items-center gap-0.5 text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" />{c.green}</span>
                        <span className="flex items-center gap-0.5 text-warning"><span className="h-1.5 w-1.5 rounded-full bg-warning" />{c.amber}</span>
                        <span className="flex items-center gap-0.5 text-destructive"><span className="h-1.5 w-1.5 rounded-full bg-destructive" />{c.red}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Month view projects each weekday's recurring shift/time-off pattern onto the calendar (mock data is weekly, not per-date).
              </p>
            </div>
          )}
        </Card>

        {/* ---- Time off requests ---- */}
        {form && (
          <Card className="border-brand-cyan/30 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Plane className="h-4 w-4 text-brand-cyanText" /> Book time off</h3>
              <button onClick={() => setForm(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-muted-foreground">Team member
                <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground">
                  {all.map((s) => <option key={s.name}>{s.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-muted-foreground">Type
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground">
                  {TIME_OFF_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-muted-foreground">Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground">
                  <option>Pending</option><option>Approved</option>
                </select>
              </label>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium text-muted-foreground">Days (this week)</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {WEEK_DAYS.map((d) => {
                  const on = form.weekDays.includes(d)
                  return (
                    <button key={d} type="button" onClick={() => setForm({ ...form, weekDays: on ? form.weekDays.filter((x) => x !== d) : [...form.weekDays, d] })}
                      className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors', on ? 'border-brand-cyan/50 bg-brand-cyan/15 text-brand-cyanText' : 'border-input text-muted-foreground hover:text-foreground')}>
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={saveBooking} disabled={saving}><Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Book'}</Button>
              <Button size="sm" variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-brand-cyanText" />
            <h2 className="text-base font-bold text-brand-cyanText">Time off this period</h2>
          </div>
          {loading ? <Skeleton className="mt-3 h-20 w-full" /> : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {allTimeOff.map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t.name}{locationId === 'all' && <span className="text-xs text-muted-foreground"> · {t.location}</span>}</div>
                    <div className="text-xs text-muted-foreground">{t.type} · {t.label} · {t.days} day{t.days === 1 ? '' : 's'}</div>
                  </div>
                  <Badge variant={t.status === 'Approved' ? 'success' : 'warning'}>{t.status}</Badge>
                </div>
              ))}
              {allTimeOff.length === 0 && <p className="text-sm text-muted-foreground">No time off booked this period.</p>}
            </div>
          )}
        </Card>

        {/* ---- Staff list ---- */}
        <Card>
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Status today</TableHead>
                  <TableHead className="text-right">Hourly wage</TableHead>
                  <TableHead className="text-right">Est. weekly pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((p) => {
                  const hrs = weeklyHours(p)
                  const todayDay = weekdayOf(today)
                  const off = offForDay(p.name, todayDay)
                  const status = off
                    ? { label: off.status === 'Pending' ? 'Pending' : off.type, variant: off.status === 'Pending' ? 'warning' : off.type === 'Training' ? 'success' : 'destructive' }
                    : p.shifts?.[todayDay]
                      ? { label: 'Working', variant: 'success' }
                      : { label: 'Not on', variant: 'destructive' }
                  return (
                    <TableRow key={p.name}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                            {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.role}</TableCell>
                      <TableCell><Badge variant={p.contract === 'Full-time' ? 'accent' : 'secondary'}>{p.contract}</Badge></TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{gbp(p.wage, { decimals: 2 })}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{gbp(hrs * p.wage)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
