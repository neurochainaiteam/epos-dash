import { useMemo, useState } from 'react'
import { Plug, Plus, RefreshCw, CheckCircle2, AlertTriangle, Circle, Store, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { PLATFORMS } from '@/data/mockData'
import { gbp, cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS = {
  Connected: { icon: CheckCircle2, variant: 'success' },
  'Action needed': { icon: AlertTriangle, variant: 'warning' },
  'Not connected': { icon: Circle, variant: 'secondary' },
}

export default function Integrations() {
  const { locationId } = useApp()
  const [toggling, setToggling] = useState(null)
  const [adding,   setAdding]   = useState(null)

  const { data: accounts,  loading: acctLoading,  error: acctError,  refetch: refetchAccounts }  = useQuery(
    () => db.fetchPlatformAccounts(locationId), [locationId],
  )
  const { data: channels,  loading: chanLoading,  error: chanError }  = useQuery(
    () => db.fetchChannelBreakdown(locationId),  [locationId],
  )

  const loading = acctLoading || chanLoading
  const error   = acctError   || chanError

  const allAccounts = accounts || []
  const allChannels = channels || []

  const platformOrders = useMemo(() => {
    const total = allChannels.reduce((s, c) => s + c.count, 0)
    return PLATFORMS.map((p) => {
      const ch = allChannels.find((c) => c.channel === p.name)
      return { ...p, count: ch?.count || 0, revenue: ch?.revenue || 0, share: total ? Math.round(((ch?.count || 0) / total) * 100) : 0 }
    })
  }, [allChannels])

  const maxShare = Math.max(1, ...allChannels.map((c) => c.count))

  async function toggle(account) {
    setToggling(account.id)
    const isConnected = account.status === 'Connected'
    await db.updatePlatformAccount(account.id, {
      status:      isConnected ? 'Not connected' : 'Connected',
      ordersToday: isConnected ? 0 : account.ordersToday,
      lastSync:    isConnected ? 'Never synced' : 'just now',
    })
    setToggling(null)
    refetchAccounts()
  }

  async function addAccount(platformKey) {
    setAdding(platformKey)
    const p = PLATFORMS.find((x) => x.key === platformKey)
    await db.insertPlatformAccount(locationId, {
      platform:    platformKey,
      accountName: `New ${p.name} store`,
      storeId:     `${p.name.slice(0, 2).toUpperCase()}-${1000 + allAccounts.length}`,
      status:      'Action needed',
    })
    setAdding(null)
    refetchAccounts()
  }

  return (
    <div>
      <PageHeader title="Integrations" description="Connected delivery platforms: orders flow into the live feed, tagged by platform">
        {loading ? <Skeleton className="h-6 w-28" /> : (
          <Badge variant="accent" className="gap-1.5">
            <Plug className="h-3.5 w-3.5" /> {allAccounts.filter((a) => a.status === 'Connected').length} connected
          </Badge>
        )}
      </PageHeader>

      <div className="space-y-5 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Channel mix */}
        <Card className="p-5">
          <CardTitle className="text-base">Today's order mix by channel</CardTitle>
          <p className="text-xs text-muted-foreground">Live split of the order feed across in-store and delivery platforms</p>
          {chanLoading ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allChannels.map((c) => (
                <div key={c.channel} className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{c.channel}</span>
                    <span className="tabular-nums text-muted-foreground">{c.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(c.count / maxShare) * 100}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{gbp(c.revenue, { decimals: 0 })}</div>
                </div>
              ))}
              {allChannels.length === 0 && <p className="text-sm text-muted-foreground">No orders today yet.</p>}
            </div>
          )}
          <Link to="/orders" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyanText hover:underline">
            View tagged orders in the live feed →
          </Link>
        </Card>

        {/* Platforms + accounts */}
        {PLATFORMS.map((p) => {
          const accts = allAccounts.filter((a) => a.platform === p.key)
          const po = platformOrders.find((x) => x.key === p.key)
          return (
            <Card key={p.key} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: p.color }}>
                    {p.name.split(' ').map((w) => w[0]).join('')}
                  </span>
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {p.commissionPct === 0 ? '0% commission' : `${p.commissionPct}% commission`} · {po?.count || 0} orders today · {accts.length} account{accts.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => addAccount(p.key)} disabled={adding === p.key}>
                  <Plus className="h-3.5 w-3.5" /> {adding === p.key ? 'Adding…' : 'Add account'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {acctLoading ? (
                  Array.from({ length: 1 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-3"><Skeleton className="h-10 w-full" /></div>
                  ))
                ) : accts.map((a) => {
                  const st = STATUS[a.status] || STATUS['Not connected']
                  const Icon = st.icon
                  const isBusy = toggling === a.id
                  return (
                    <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Store className="h-4 w-4" /></span>
                        <div>
                          <div className="text-sm font-medium text-foreground">{a.accountName}</div>
                          <div className="text-xs text-muted-foreground">Store {a.storeId}{locationId === 'all' && a.location ? ` · ${a.location}` : ''} · synced {a.lastSync}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={st.variant} className="gap-1"><Icon className="h-3 w-3" />{a.status}</Badge>
                        <span className="text-xs tabular-nums text-muted-foreground">{a.ordersToday} today</span>
                        <Button size="sm" variant="ghost" onClick={() => toggle(a)} disabled={isBusy}>
                          <RefreshCw className="h-3.5 w-3.5" /> {isBusy ? '…' : a.status === 'Connected' ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {!acctLoading && accts.length === 0 && <p className="py-2 text-sm text-muted-foreground">No accounts yet. Add one to start importing orders.</p>}
              </CardContent>
            </Card>
          )
        })}

        <p className="text-xs text-muted-foreground">Connections are simulated for this preview. Incoming orders are mocked and flow into the Orders feed tagged by platform.</p>
      </div>
    </div>
  )
}
