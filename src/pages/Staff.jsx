import { useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { WEEK_DAYS } from '@/data/mockData'
import { gbp } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

function weeklyHours(staff) {
  return WEEK_DAYS.filter((d) => staff.shifts?.[d]).length * 7
}

export default function Staff() {
  const { locationId } = useApp()

  const { data: staff, loading, error } = useQuery(
    () => db.fetchStaff(locationId),
    [locationId],
  )
  const all = staff || []

  const { weeklyWageBill, avgWage } = useMemo(() => ({
    weeklyWageBill: all.reduce((s, p) => s + weeklyHours(p) * p.wage, 0),
    avgWage: all.length ? all.reduce((s, p) => s + p.wage, 0) / all.length : 0,
  }), [all])

  return (
    <div>
      <PageHeader title="Staff" description="Team, roles & hourly wages" />

      <div className="space-y-4 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-12 w-full" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-4"><div className="text-xs text-muted-foreground">Team size</div><div className="mt-1 text-xl font-bold tabular-nums">{all.length}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Avg hourly</div><div className="mt-1 text-xl font-bold tabular-nums">{gbp(avgWage, { decimals: 2 })}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Est. weekly wage bill</div><div className="mt-1 text-xl font-bold tabular-nums">{gbp(weeklyWageBill)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Full-time</div><div className="mt-1 text-xl font-bold tabular-nums">{all.filter((s) => s.contract === 'Full-time').length}</div></Card>
          </div>
        )}

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
                  <TableHead className="text-right">Hourly wage</TableHead>
                  <TableHead className="text-right">Est. hrs/wk</TableHead>
                  <TableHead className="text-right">Est. weekly pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((p) => {
                  const hrs = weeklyHours(p)
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
                      <TableCell className="text-right tabular-nums">{gbp(p.wage, { decimals: 2 })}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{hrs}h</TableCell>
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
