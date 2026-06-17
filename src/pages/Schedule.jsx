import { useMemo, useState } from 'react'
import { Info, Plane, Plus, X, Check, CalendarOff, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { TIME_OFF_TYPES, WEEK_DAYS } from '@/data/mockData'
import { ROLES } from '@/config/roles'
import { cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const TYPE_TONE = {
  Holiday:  'bg-warning/15 text-warning',
  Sick:     'bg-destructive/15 text-destructive',
  Unpaid:   'bg-muted text-muted-foreground',
  Training: 'bg-brand-cyan/15 text-brand-cyanText',
}

export default function Schedule() {
  const { locationId, role, session } = useApp()
  const isStaff = role === ROLES.STAFF
  const myName = session?.user?.user_metadata?.name

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

  const allStaff   = staff   || []
  const allTimeOff = timeOff || []
  const loading    = staffLoading || toLoading

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

  async function saveBooking() {
    if (!form.name || form.weekDays.length === 0) return
    setSaving(true)
    const entry = {
      name:     form.name,
      role:     allStaff.find((s) => s.name === form.name)?.role || '',
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
      <PageHeader title="Schedule" description="Weekly rota & time-off">
        <Badge variant="secondary">Week of 8–14 Jun</Badge>
        <Button size="sm" onClick={() => setForm({ name: allStaff[0]?.name || '', type: 'Holiday', status: 'Pending', weekDays: [] })}>
          <Plus className="h-3.5 w-3.5" /> Book time off
        </Button>
      </PageHeader>

      <div className="space-y-4 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {isStaff && (
          <Card className="flex items-center gap-2.5 border-primary/30 bg-accent/40 p-3 text-sm">
            <Info className="h-4 w-4 shrink-0 text-brand-cyanText" />
            <span>Your shifts are highlighted below. Holidays and time-off show on the rota in colour.</span>
          </Card>
        )}

        {form && (
          <Card className="border-brand-cyan/30 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Plane className="h-4 w-4 text-brand-cyanText" /> Book time off</h3>
              <button onClick={() => setForm(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-muted-foreground">Team member
                <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground">
                  {allStaff.map((s) => <option key={s.name}>{s.name}</option>)}
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

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            {loading ? <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
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
                  {allStaff.map((p) => {
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
                                <span className={cn('inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold', TYPE_TONE[off.type] || TYPE_TONE.Holiday, off.status === 'Pending' && 'opacity-70 ring-1 ring-dashed')} title={`${off.type} · ${off.status}`}>
                                  <CalendarOff className="h-3 w-3" />{off.type}
                                </span>
                              ) : p.shifts?.[d] ? (
                                <span className={cn('inline-block w-full rounded-md px-2 py-1.5 text-xs font-medium tabular-nums', mine ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}>
                                  {p.shifts[d]}
                                </span>
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
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-brand-cyanText" />
            <h2 className="text-base font-bold text-foreground">Time off this period</h2>
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
          <p className="mt-3 text-xs text-muted-foreground">Booked time-off feeds the staff-availability cover alerts on the Recommendations page.</p>
        </Card>
      </div>
    </div>
  )
}
