import { Building2, Bell, Plug, Users2, ChevronRight, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LOCATIONS } from '@/data/mockData'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function Toggle({ on }) {
  return (
    <span className={'relative inline-flex h-5 w-9 items-center rounded-full ' + (on ? 'bg-primary' : 'bg-muted')}>
      <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition ' + (on ? 'translate-x-4' : 'translate-x-0.5')} />
    </span>
  )
}

const INTEGRATIONS = [
  { name: 'Square EPOS', desc: 'Live order & sales sync', connected: true },
  { name: 'Xero', desc: 'Accounting & P&L export', connected: true },
  { name: 'Deliveroo', desc: 'Third-party order import', connected: false },
  { name: 'Uber Eats', desc: 'Third-party order import', connected: false },
]

const NOTIFS = [
  { label: 'Daily P&L summary email', on: true },
  { label: 'Low-stock alerts', on: true },
  { label: 'Labour cost over target warnings', on: true },
  { label: 'New booking notifications', on: false },
]

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Company, locations & integrations" />

      <div className="grid gap-4 p-5 sm:p-8 lg:grid-cols-2">
        {/* Company */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-muted-foreground" /> Company</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Business name</span><span className="font-medium">NeuroChain Ai Group Ltd</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAT number</span><span className="font-medium">GB 482 1190 33</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span className="font-medium">GBP (£)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Default VAT rate</span><span className="font-medium">20%</span></div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Users2 className="h-4 w-4 text-muted-foreground" /> Locations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {LOCATIONS.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><div className="text-sm font-medium">{l.name}</div><div className="text-xs text-muted-foreground">{l.address}</div></div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Plug className="h-4 w-4 text-muted-foreground" /> Integrations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {INTEGRATIONS.map((it) => (
              <div key={it.name} className="flex items-center justify-between rounded-lg border p-3">
                <div><div className="text-sm font-medium">{it.name}</div><div className="text-xs text-muted-foreground">{it.desc}</div></div>
                <Badge variant={it.connected ? 'success' : 'secondary'}>{it.connected ? 'Connected' : 'Connect'}</Badge>
              </div>
            ))}
            <Link to="/integrations" className="flex items-center justify-center gap-1.5 rounded-lg border border-brand-cyan/20 bg-brand-cyan/5 p-2.5 text-sm font-medium text-brand-cyan transition-colors hover:bg-brand-cyan/10">
              Manage delivery platforms <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-muted-foreground" /> Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {NOTIFS.map((n) => (
              <div key={n.label} className="flex items-center justify-between rounded-lg px-2 py-2.5">
                <span className="text-sm text-foreground/90">{n.label}</span>
                <Toggle on={n.on} />
              </div>
            ))}
            <p className="px-2 pt-3 text-xs text-muted-foreground">Placeholder, toggles are illustrative in this preview.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
