import { useState } from 'react'
import { Check, Sunrise, Moon, Sparkles, RotateCcw, Repeat, Bell, History, Building2, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { CHECKLIST_TEMPLATE, RECURRENCE_OPTIONS, WEEK_DAYS } from '@/data/mockData'
import { ROLES } from '@/config/roles'
import { cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const SECTION_ICON = { Opening: Sunrise, Closing: Moon, Cleaning: Sparkles }

function key(section, i) {
  return `${section}:${i}`
}

function Toggle({ on, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', on ? 'bg-brand-gradient' : 'bg-muted')}>
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition', on ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  )
}

export default function Checklists() {
  const { role, locationId } = useApp()
  const isDirector = role === ROLES.DIRECTOR

  const [done, setDone] = useState(() => ({ 'Opening:0': true, 'Opening:1': true }))

  const { data: schedulesData, loading: schLoading, error: schError } = useQuery(
    () => db.fetchChecklistSchedules(),
    [],
  )
  const { data: history, loading: histLoading, error: histError } = useQuery(
    () => db.fetchChecklistHistory(locationId),
    [locationId],
  )

  const [localSchedules, setLocalSchedules] = useState(null)
  const schedules = localSchedules ?? (schedulesData || [])

  function toggle(section, i) {
    const k = key(section, i)
    setDone((d) => ({ ...d, [k]: !d[k] }))
  }
  function resetAll() { setDone({}) }

  function updateSchedule(section, patch) {
    setLocalSchedules((prev) => {
      const base = prev ?? (schedulesData || [])
      return base.map((x) => x.section === section ? { ...x, ...patch } : x)
    })
    db.upsertChecklistSchedule(section, patch)
  }

  const totalTasks = CHECKLIST_TEMPLATE.reduce((s, sec) => s + sec.tasks.length, 0)
  const completed  = Object.values(done).filter(Boolean).length
  const overallPct = Math.round((completed / totalTasks) * 100)
  const histList   = history || []
  const error      = schError || histError

  return (
    <div>
      <PageHeader title="Checklists" description="Opening, closing & cleaning: scheduled, recurring & logged">
        <Badge variant={overallPct === 100 ? 'success' : 'accent'}>{completed}/{totalTasks} done today</Badge>
        <Button variant="outline" size="sm" onClick={resetAll}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
      </PageHeader>

      <div className="space-y-6 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Schedule / recurrence */}
        <Card className="p-6">
          <CardTitle className="flex items-center gap-2 text-base"><Repeat className="h-4 w-4 text-brand-cyanText" /> Schedule & reminders</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Set how often each checklist recurs and when the team is reminded.</p>
          {schLoading ? <Skeleton className="mt-4 h-48 w-full" /> : (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {schedules.map((s) => {
                const Icon = SECTION_ICON[s.section] || Check
                return (
                  <div key={s.section} className="rounded-xl border border-border/70 bg-background/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyanText"><Icon className="h-3.5 w-3.5" /></span>
                        {s.section}
                      </div>
                      <Toggle on={s.active} onClick={() => updateSchedule(s.section, { active: !s.active })} />
                    </div>
                    <div className="mt-3 space-y-2.5">
                      <label className="block text-xs font-medium text-muted-foreground">Recurrence
                        <select value={s.recurrence || 'Daily'} onChange={(e) => updateSchedule(s.section, { recurrence: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground">
                          {RECURRENCE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </label>
                      {s.recurrence !== 'Daily' && (
                        <label className="block text-xs font-medium text-muted-foreground">Day
                          <select value={s.day || 'Mon'} onChange={(e) => updateSchedule(s.section, { day: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-sm text-foreground">
                            {WEEK_DAYS.map((d) => <option key={d}>{d}</option>)}
                          </select>
                        </label>
                      )}
                      <label className="block text-xs font-medium text-muted-foreground">Reminder time
                        <div className="mt-1 flex items-center gap-2 rounded-lg border bg-background px-2.5">
                          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                          <input type="time" value={s.reminder || '08:00'} onChange={(e) => updateSchedule(s.section, { reminder: e.target.value })} className="h-9 w-full bg-transparent text-sm text-foreground focus:outline-none" />
                        </div>
                      </label>
                      <div className="text-[11px] text-muted-foreground">
                        {s.active ? <>Recurs <span className="font-medium text-foreground">{(s.recurrence || 'Daily').toLowerCase()}</span>{s.recurrence !== 'Daily' ? ` on ${s.day || 'Mon'}` : ''} · reminds at {s.reminder || '08:00'}</> : 'Paused'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Today's run */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today's checklists</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {CHECKLIST_TEMPLATE.map((sec) => {
              const Icon = SECTION_ICON[sec.section] || Check
              const secDone = sec.tasks.filter((_, i) => done[key(sec.section, i)]).length
              const pct = Math.round((secDone / sec.tasks.length) * 100)
              return (
                <Card key={sec.section} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyanText"><Icon className="h-4 w-4" /></span>
                        {sec.section}
                      </CardTitle>
                      <span className="text-sm font-semibold tabular-nums text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-success' : 'bg-primary')} style={{ width: `${pct}%` }} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-1">
                    {sec.tasks.map((task, i) => {
                      const checked = !!done[key(sec.section, i)]
                      return (
                        <button key={i} onClick={() => toggle(sec.section, i)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50">
                          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors', checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card')}>
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span className={cn('text-sm', checked ? 'text-muted-foreground line-through' : 'text-foreground')}>{task}</span>
                        </button>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Completion history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-brand-cyanText" /> Completion history
              {isDirector && <Badge variant="secondary" className="gap-1"><Building2 className="h-3 w-3" /> All locations</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {histLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2">Date</th>
                      {locationId === 'all' && <th className="py-2">Location</th>}
                      <th className="py-2">Checklist</th>
                      <th className="py-2">Completed by</th>
                      <th className="py-2">At</th>
                      <th className="py-2 text-right">Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {histList.map((h, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5 text-muted-foreground">{h.date}</td>
                        {locationId === 'all' && <td className="py-2.5 text-muted-foreground">{h.location}</td>}
                        <td className="py-2.5"><Badge variant="secondary">{h.section}</Badge></td>
                        <td className="py-2.5 font-medium text-foreground">{h.by}</td>
                        <td className="py-2.5 tabular-nums text-muted-foreground">{h.at}</td>
                        <td className="py-2.5 text-right">
                          <span className={cn('tabular-nums', h.done === h.total ? 'text-success' : 'text-warning')}>{h.done}/{h.total}</span>
                        </td>
                      </tr>
                    ))}
                    {histList.length === 0 && (
                      <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No completions recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
