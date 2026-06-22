import { useMemo, useState } from 'react'
import {
  MessageSquare, Send, Phone, PhoneMissed, PhoneCall, Voicemail,
  Plus, X, Megaphone, Eye, BadgePercent, AlertCircle,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const AUDIENCES = ['All opted-in', 'Lapsed 30+ days', 'Delivery customers', 'Collection customers', 'Top spenders']

const STATUS_VARIANT = { Completed: 'success', Scheduled: 'warning', Sending: 'accent', Draft: 'secondary' }
const OUTCOME = {
  Answered: { icon: PhoneCall,  variant: 'success'     },
  Missed:   { icon: PhoneMissed, variant: 'destructive' },
  Voicemail:{ icon: Voicemail,  variant: 'warning'     },
}

function rate(n, d) { return d ? Math.round((n / d) * 100) : 0 }

function Funnel({ c }) {
  const stages = [
    { label: 'Sent',      value: c.sent,      pct: 100,                         tone: 'bg-brand-cyan/40'  },
    { label: 'Delivered', value: c.delivered,  pct: rate(c.delivered, c.sent),   tone: 'bg-brand-cyan/70'  },
    { label: 'Opened',    value: c.opened,     pct: rate(c.opened, c.sent),      tone: 'bg-brand-cyan'     },
    { label: 'Redeemed',  value: c.redeemed,   pct: rate(c.redeemed, c.sent),    tone: 'bg-success'  },
  ]
  return (
    <div className="grid grid-cols-4 gap-2">
      {stages.map((s) => (
        <div key={s.label}>
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
          <div className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{s.value.toLocaleString()}</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full', s.tone)} style={{ width: `${s.pct}%` }} />
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">{s.pct}%</div>
        </div>
      ))}
    </div>
  )
}

export default function Marketing() {
  const { locationId } = useApp()
  const [compose, setCompose] = useState(null)
  const [sending, setSending] = useState(false)

  const { data: campaigns, loading: campLoading, error: campError, refetch: refetchCamp } = useQuery(
    () => db.fetchSmsCampaigns(locationId),
    [locationId],
  )
  const { data: calls, loading: callsLoading, error: callsError } = useQuery(
    () => db.fetchCallLog(locationId),
    [locationId],
  )

  const allCampaigns = campaigns || []
  const allCalls     = calls     || []
  const loading = campLoading || callsLoading
  const error   = campError   || callsError

  const stats = useMemo(() => {
    const completed = allCampaigns.filter((c) => c.sent > 0)
    const sent      = completed.reduce((s, c) => s + c.sent, 0)
    const opened    = completed.reduce((s, c) => s + c.opened, 0)
    const redeemed  = completed.reduce((s, c) => s + c.redeemed, 0)
    return {
      campaigns: allCampaigns.length,
      sent,
      openRate: rate(opened, sent),
      redeemed,
      missed: allCalls.filter((c) => c.outcome === 'Missed').length,
    }
  }, [allCampaigns, allCalls])

  async function send() {
    if (!compose.name || !compose.message) return
    setSending(true)
    const base = 1200
    const campaign = {
      name:      compose.name,
      audience:  compose.audience,
      message:   compose.message,
      sent:      base,
      delivered: Math.round(base * 0.98),
      opened:    Math.round(base * 0.46),
      redeemed:  Math.round(base * 0.07),
      status:    'Completed',
      date:      new Date().toLocaleDateString('en-GB'),
    }
    await db.insertSmsCampaign(locationId, campaign)
    setSending(false)
    setCompose(null)
    refetchCamp()
  }

  return (
    <div>
      <PageHeader title="Marketing" description="SMS campaigns & caller-ID: reach customers and track results">
        <Button size="sm" onClick={() => setCompose({ name: '', audience: AUDIENCES[0], message: '' })}>
          <Plus className="h-3.5 w-3.5" /> New campaign
        </Button>
      </PageHeader>

      <div className="space-y-5 p-5 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-12 w-full" /></Card>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-6"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Megaphone className="h-3.5 w-3.5 text-brand-cyanText" />Campaigns</div><div className="mt-1 text-xl font-bold tabular-nums">{stats.campaigns}</div></Card>
            <Card className="p-6"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Send className="h-3.5 w-3.5 text-brand-cyanText" />SMS sent</div><div className="mt-1 text-xl font-bold tabular-nums">{stats.sent.toLocaleString()}</div></Card>
            <Card className="p-6"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Eye className="h-3.5 w-3.5 text-brand-cyanText" />Avg open rate</div><div className="mt-1 text-xl font-bold tabular-nums">{stats.openRate}%</div></Card>
            <Card className="p-6"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><BadgePercent className="h-3.5 w-3.5 text-success" />Redeemed</div><div className="mt-1 text-xl font-bold tabular-nums">{stats.redeemed.toLocaleString()}</div></Card>
          </div>
        )}

        {compose && (
          <Card className="border-brand-cyan/30 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><MessageSquare className="h-4 w-4 text-brand-cyanText" /> New SMS campaign</h3>
              <button onClick={() => setCompose(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">Campaign name
                <input value={compose.name} onChange={(e) => setCompose({ ...compose, name: e.target.value })} placeholder="e.g. Friday Flash Deal" className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="text-xs font-medium text-muted-foreground">Audience
                <select value={compose.audience} onChange={(e) => setCompose({ ...compose, audience: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground">
                  {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-3 block text-xs font-medium text-muted-foreground">Message
              <textarea value={compose.message} onChange={(e) => setCompose({ ...compose, message: e.target.value })} rows={3} maxLength={300} placeholder="🍕 Treat yourself tonight: 20% off all pizzas with code…" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{compose.message.length}/160 chars · {Math.max(1, Math.ceil(compose.message.length / 160))} SMS segment(s)</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={send} disabled={sending}><Send className="h-3.5 w-3.5" /> {sending ? 'Sending…' : 'Send campaign'}</Button>
              <Button size="sm" variant="ghost" onClick={() => setCompose(null)}>Cancel</Button>
            </div>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Campaigns</h2>
            {campLoading ? Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6"><Skeleton className="h-24 w-full" /></Card>) : (
              allCampaigns.map((c) => (
                <Card key={c.id} className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{c.name}</span>
                      <Badge variant={STATUS_VARIANT[c.status] || 'secondary'}>{c.status}</Badge>
                      {locationId === 'all' && <Badge variant="secondary">{c.location}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">{c.date} · {c.audience}</span>
                  </div>
                  <p className="mt-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground/80">{c.message}</p>
                  {c.sent > 0 ? (
                    <div className="mt-3"><Funnel c={c} /></div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Scheduled. Results will appear once it sends.</p>
                  )}
                </Card>
              ))
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Call log · caller-ID</h2>
            <Card className="divide-y divide-border/60">
              {callsLoading ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3"><Skeleton className="h-10 w-full" /></div>
              )) : allCalls.map((call, i) => {
                const o = OUTCOME[call.outcome] || OUTCOME.Answered
                const Icon = o.icon
                return (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      call.outcome === 'Missed' ? 'bg-destructive/15 text-destructive' : 'bg-brand-cyan/10 text-brand-cyanText')}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{call.name}</div>
                      <div className="text-xs text-muted-foreground">{call.number} · {call.type}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs tabular-nums text-muted-foreground">{call.time}</div>
                      <div className="text-[11px] text-muted-foreground">{call.durationSec ? `${Math.floor(call.durationSec / 60)}m ${call.durationSec % 60}s` : 'N/A'}</div>
                    </div>
                  </div>
                )
              })}
            </Card>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" /> Placeholder for real telephony / caller-ID integration.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
