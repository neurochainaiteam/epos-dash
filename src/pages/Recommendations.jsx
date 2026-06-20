import { useMemo } from 'react'
import {
  Sparkles, Lightbulb, AlertTriangle, ArrowRight,
  PackageX, TrendingDown, TrendingUp, Percent, Users2, Trash2, ShoppingBag,
  Utensils, Clock, CalendarOff, AlertCircle,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { buildRecommendations } from '@/lib/recommendations'
import { locationName } from '@/data/mockData'
import { cn } from '@/lib/utils'
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

function InsightCard({ card }) {
  const Icon = ICONS[card.icon] || Sparkles
  return (
    <Card className="flex flex-col border-border/70 transition-all hover:border-brand-cyan/40 hover:shadow-glow-cyan">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 ring-1 ring-brand-cyan/25">
          <Icon className="h-[22px] w-[22px] text-brand-cyanText" />
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
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyanText" />
        <span className="text-sm font-medium text-foreground">{card.action}</span>
      </div>
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

  const loading = l1||l2||l3||l4||l5||l6||l7||l8||l9||l10||l11
  const error   = e1||e2||e3||e4||e5||e6||e7||e8||e9||e10||e11

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

        <Card className="relative overflow-hidden border-brand-cyan/20 p-5 sm:p-6">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow-cyan">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">For {locationName(locationId)}</div>
                {loading ? <Skeleton className="mt-1 h-6 w-48" /> : (
                  <div className="text-xl font-bold text-foreground">
                    <span className="text-brand-cyanText">{counts.opportunities} opportunities</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="rec-title">{counts.warnings} things to watch</span>
                  </div>
                )}
              </div>
            </div>
            {!loading && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-brand-cyan/25 bg-brand-cyan/5 px-3 py-2">
                  <Lightbulb className="h-4 w-4 text-brand-cyanText" />
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
              <Card key={i} className="p-5"><Skeleton className="h-48 w-full" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => <InsightCard key={card.id} card={card} />)}
          </div>
        )}

        {!loading && cards.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground">
            Everything looks healthy at {locationName(locationId)}, no flags right now.
          </Card>
        )}
      </div>
    </div>
  )
}
