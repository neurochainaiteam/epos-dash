import { useMemo } from 'react'
import { Trash2, Utensils, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { gbp } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const reasonVariant = {
  Expired: 'destructive', Spoiled: 'destructive', 'Thawed twice': 'destructive',
  'Order error': 'warning', Burnt: 'warning', 'Over-cooked': 'warning', 'Over-prepped': 'warning',
}

export default function Waste() {
  const { locationId } = useApp()

  const { data: waste, loading, error } = useQuery(
    () => db.fetchWaste(locationId),
    [locationId],
  )
  const all = waste || []

  const { total, byReason, byRecipe } = useMemo(() => {
    const m = new Map()
    all.forEach((w) => m.set(w.reason, (m.get(w.reason) || 0) + w.cost))
    const recipeMap = new Map()
    all.forEach((w) => recipeMap.set(w.recipe, (recipeMap.get(w.recipe) || 0) + w.cost))
    return {
      total:    all.reduce((s, w) => s + w.cost, 0),
      byReason: [...m.entries()].sort((a, b) => b[1] - a[1]),
      byRecipe: [...recipeMap.entries()].sort((a, b) => b[1] - a[1]).map(([recipe, cost]) => ({ recipe, cost })),
    }
  }, [all])

  const maxRecipe = Math.max(1, ...byRecipe.map((r) => r.cost))

  return (
    <div>
      <PageHeader title="Waste log" description="Logged waste, cost impact & per-item attribution" />

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
            <Card className="p-4"><div className="text-xs text-muted-foreground">Entries</div><div className="mt-1 text-xl font-bold tabular-nums">{all.length}</div></Card>
            <Card className="p-4 ring-1 ring-destructive/20"><div className="flex items-center gap-1.5 text-xs text-destructive"><Trash2 className="h-3.5 w-3.5" />Waste cost</div><div className="mt-1 text-xl font-bold tabular-nums text-destructive">{gbp(total, { decimals: 2 })}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Top reason</div><div className="mt-1 text-base font-bold">{byReason[0]?.[0] ?? 'N/A'}</div></Card>
            <Card className="p-4"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Utensils className="h-3.5 w-3.5" />Costliest item</div><div className="mt-1 truncate text-base font-bold">{byRecipe[0]?.recipe ?? 'N/A'}</div></Card>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <CardTitle className="flex items-center gap-2 text-base"><Utensils className="h-4 w-4 text-brand-cyanText" /> Waste by menu item</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Cost attributed to the dish each waste line feeds</p>
            {loading ? <Skeleton className="mt-4 h-40 w-full" /> : (
              <div className="mt-4 space-y-3">
                {byRecipe.map((r) => (
                  <div key={r.recipe}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate pr-2 text-foreground/85">{r.recipe}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{gbp(r.cost, { decimals: 2 })}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(r.cost / maxRecipe) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Waste entries</CardTitle></CardHeader>
            <CardContent className="pt-0">
              {loading ? <Skeleton className="h-64 w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      {locationId === 'all' && <TableHead>Location</TableHead>}
                      <TableHead>Item</TableHead>
                      <TableHead>Attributed to</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {all.map((w, idx) => (
                      <TableRow key={`${w.location}-${w.item}-${idx}`}>
                        <TableCell className="text-muted-foreground">{w.date}</TableCell>
                        {locationId === 'all' && <TableCell className="text-muted-foreground">{w.location}</TableCell>}
                        <TableCell className="font-medium">{w.item}<div className="text-xs text-muted-foreground">{w.qty}</div></TableCell>
                        <TableCell className="text-muted-foreground">{w.recipe}</TableCell>
                        <TableCell><Badge variant={reasonVariant[w.reason] || 'secondary'}>{w.reason}</Badge></TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{gbp(w.cost, { decimals: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
