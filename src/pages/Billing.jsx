import { useState } from 'react'
import { CreditCard, Check, Lock, Download, Building2, Sparkles, Wrench } from 'lucide-react'
import { LOCATIONS, PLANS, PLAN_FEATURES, SETUP_FEE, CURRENT_PLAN_KEY } from '@/data/mockData'
import { gbp, cn } from '@/lib/utils'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function Billing() {
  const [selected, setSelected] = useState(CURRENT_PLAN_KEY)
  const current = PLANS.find((p) => p.key === CURRENT_PLAN_KEY)
  const monthly = current.price
  const INVOICES = [
    { id: 'INV-2026-006', date: '1 Jun 2026', amount: monthly, status: 'Paid' },
    { id: 'INV-2026-005', date: '1 May 2026', amount: monthly, status: 'Paid' },
    { id: 'INV-2026-004', date: '1 Apr 2026', amount: 69, status: 'Paid' },
  ]

  return (
    <div>
      <PageHeader title="Billing & Plans" description="Subscription, plan comparison & invoices (company-wide)">
        <Badge variant="success">On {current.name}</Badge>
      </PageHeader>

      <div className="space-y-6 p-5 sm:p-8">
        {/* Plans */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Choose your plan</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {PLANS.map((p) => {
              const isCurrent = p.key === CURRENT_PLAN_KEY
              const isSelected = p.key === selected
              return (
                <Card
                  key={p.key}
                  onClick={() => setSelected(p.key)}
                  className={cn(
                    'relative cursor-pointer overflow-hidden p-5 transition-all',
                    isSelected ? 'border-brand-cyan/50 shadow-glow-cyan' : 'hover:border-brand-cyan/30',
                  )}
                >
                  {p.popular && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-gradient px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      <Sparkles className="h-3 w-3" /> Popular
                    </span>
                  )}
                  <div className="text-sm font-bold text-[#E1E1E1]">{p.name}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tabular-nums text-[#E1E1E1]">{gbp(p.price)}</span>
                    <span className="text-sm text-muted-foreground">/{p.period}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.locations}</div>
                  <p className="mt-2 text-sm text-[#E1E1E1]/80">{p.tagline}</p>
                  <div className="mt-4">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>Current plan</Button>
                    ) : (
                      <Button className="w-full" variant={p.price > current.price ? 'default' : 'secondary'}>
                        {p.price > current.price ? 'Upgrade' : 'Switch'} to {p.name}
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-brand-magenta/20 bg-brand-magenta/5 p-3 text-sm">
            <Wrench className="h-4 w-4 shrink-0 text-brand-magenta" />
            <span className="text-foreground/85">One-off onboarding & setup service: <span className="font-semibold text-[#E1E1E1]">{gbp(SETUP_FEE.min)}–{gbp(SETUP_FEE.max)}</span> (menu import, EPOS connection & staff training).</span>
          </div>
        </div>

        {/* Feature comparison */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2"><CardTitle className="text-base">What’s included</CardTitle></CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feature</th>
                    {PLANS.map((p) => (
                      <th key={p.key} className={cn('px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide', p.key === CURRENT_PLAN_KEY ? 'text-brand-cyan' : 'text-muted-foreground')}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLAN_FEATURES.map((f) => (
                    <tr key={f.label} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-2.5 text-foreground/90">{f.label}</td>
                      {PLANS.map((p) => {
                        const has = f.plans.includes(p.key)
                        return (
                          <td key={p.key} className="px-4 py-2.5 text-center">
                            {has ? (
                              <Check className="mx-auto h-4 w-4 text-success" />
                            ) : (
                              <Lock className="mx-auto h-3.5 w-3.5 text-muted-foreground/40" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment + locations + invoices */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle className="text-base">Current subscription</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">NeuroChain Ai {current.name}</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{LOCATIONS.length} locations · billed monthly</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold tabular-nums">{gbp(monthly)}<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                  <div className="text-xs text-muted-foreground">next charge 1 Jul 2026</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Payment method</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <span className="flex h-9 w-12 items-center justify-center rounded-md bg-sidebar text-white"><CreditCard className="h-4 w-4" /></span>
                <div className="text-sm"><div className="font-medium">Visa ending 4242</div><div className="text-xs text-muted-foreground">Expires 09/27</div></div>
              </div>
              <div className="rounded-lg bg-accent/40 p-3 text-xs text-muted-foreground">Placeholder, payment processing not wired up in this preview.</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Locations on this account</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {LOCATIONS.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Building2 className="h-4 w-4" /></span>
                    <div><div className="text-sm font-medium">{l.name}</div><div className="text-xs text-muted-foreground">{l.city}</div></div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Invoice history</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {INVOICES.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div><div className="font-medium">{inv.id}</div><div className="text-xs text-muted-foreground">{inv.date}</div></div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold tabular-nums">{gbp(inv.amount)}</span>
                    <Badge variant="success">{inv.status}</Badge>
                    <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /> PDF</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
