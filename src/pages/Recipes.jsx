import { useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { pct, gbp, cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

function marginVariant(foodCostPct) {
  if (foodCostPct <= 30) return 'success'
  if (foodCostPct <= 38) return 'warning'
  return 'destructive'
}

export default function Recipes() {
  const { locationId } = useApp()

  const { data: recipes, loading, error } = useQuery(
    () => db.fetchRecipes(locationId),
    [locationId],
  )
  const all = recipes || []

  const avgFoodCost = useMemo(
    () => all.length ? all.reduce((s, r) => s + r.foodCostPct, 0) / all.length : 0,
    [all],
  )

  return (
    <div>
      <PageHeader title="Recipes" description="Menu items, ingredient cost & margin per dish">
        {loading ? <Skeleton className="h-6 w-32" /> : <Badge variant="accent">Avg food cost {pct(avgFoodCost)}</Badge>}
      </PageHeader>

      <div className="p-5 sm:p-8">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader className="pb-3"><Skeleton className="h-20 w-full" /></CardHeader>
                <CardContent><Skeleton className="h-32 w-full" /></CardContent>
              </Card>
            ))
            : all.map((r, idx) => (
              <Card key={`${r.location}-${r.dish}-${idx}`} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{r.dish}</CardTitle>
                    <Badge variant={marginVariant(r.foodCostPct)}>{pct(r.foodCostPct)} cost</Badge>
                  </div>
                  {locationId === 'all' && <p className="text-xs text-muted-foreground">{r.location}</p>}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {(r.ingredients || []).map((ing) => (
                      <span key={ing} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{ing}</span>
                    ))}
                  </div>
                  <div className="mt-auto space-y-2 border-t pt-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Menu price</span><span className="font-semibold tabular-nums">{gbp(r.price, { decimals: 2 })}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Food cost</span><span className="tabular-nums">{gbp(r.portionCost, { decimals: 2 })}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Gross profit</span><span className="font-semibold tabular-nums text-success">{gbp(r.price - r.portionCost, { decimals: 2 })}</span></div>
                    <div className="pt-1">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Gross margin</span>
                        <span className="font-semibold">{pct(r.margin)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className={cn('h-full rounded-full', r.margin >= 65 ? 'bg-success' : r.margin >= 55 ? 'bg-warning' : 'bg-destructive')} style={{ width: `${r.margin}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
