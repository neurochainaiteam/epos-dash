import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Wallet, Receipt, X, Check, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { EXPENSE_CATEGORIES, locationName } from '@/data/mockData'
import { gbp, cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const TODAY_LABEL = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const BLANK = { id: null, date: TODAY_LABEL, category: 'Rent', vendor: '', amount: '', note: '' }

const CAT_TONE = {
  Rent: 'bg-brand-magenta', Utilities: 'bg-brand-cyan', Insurance: 'bg-success',
  Packaging: 'bg-warning', Marketing: 'bg-brand-magenta',
}
function catColor(cat) { return CAT_TONE[cat] || 'bg-brand-cyan/70' }

export default function Expenses() {
  const { locationId } = useApp()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const { data: expenses, loading, error, refetch } = useQuery(
    () => db.fetchExpenses(locationId),
    [locationId],
  )
  const rows = expenses || []

  const { total, byCategory } = useMemo(() => {
    const total = rows.reduce((s, e) => s + Number(e.amount || 0), 0)
    const map = new Map()
    for (const e of rows) map.set(e.category, (map.get(e.category) || 0) + Number(e.amount || 0))
    return {
      total,
      byCategory: [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    }
  }, [rows])

  const maxCat = Math.max(1, ...byCategory.map((c) => c.amount))

  async function save() {
    if (!form.vendor || !form.amount) return
    setSaving(true)
    setFormError(null)
    const { error } = await db.upsertExpense(locationId, { ...form, amount: Number(form.amount) })
    if (error) { setFormError(error.message); setSaving(false); return }
    setSaving(false)
    setForm(null)
    refetch()
  }

  async function remove(id) {
    await db.deleteExpense(id)
    refetch()
  }

  return (
    <div>
      <PageHeader title="Expenses" description="Business overheads — manual entry feeds the P&L">
        {loading ? <Skeleton className="h-6 w-28" /> : <Badge variant="accent" className="gap-1.5"><Wallet className="h-3.5 w-3.5" /> {gbp(total)} logged</Badge>}
        <Button size="sm" onClick={() => setForm({ ...BLANK })}><Plus className="h-3.5 w-3.5" /> Add expense</Button>
      </PageHeader>

      <div className="space-y-5 p-5 sm:p-8">
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
            <Card className="p-4"><div className="text-xs text-muted-foreground">Entries</div><div className="mt-1 text-xl font-bold tabular-nums">{rows.length}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Logged this period</div><div className="mt-1 text-xl font-bold tabular-nums">{gbp(total)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Top category</div><div className="mt-1 text-base font-bold">{byCategory[0]?.category ?? 'N/A'}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Location</div><div className="mt-1 text-base font-bold truncate">{locationName(locationId)}</div></Card>
          </div>
        )}

        {form && (
          <Card className="border-brand-cyan/30 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#E1E1E1]">{form.id ? 'Edit expense' : 'New expense'}</h3>
              <button onClick={() => setForm(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            {formError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="text-xs font-medium text-muted-foreground">Date
                <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="text-xs font-medium text-muted-foreground">Category
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-xs font-medium text-muted-foreground">Vendor
                <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. British Gas" className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="text-xs font-medium text-muted-foreground">Amount (£)
                <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} type="number" placeholder="0.00" className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground tabular-nums" />
              </label>
              <label className="text-xs font-medium text-muted-foreground">Note
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm text-foreground" />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={save} disabled={saving}><Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add expense'}</Button>
              <Button size="sm" variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <CardTitle className="text-base">By category</CardTitle>
            {loading ? <Skeleton className="mt-4 h-40 w-full" /> : (
              <div className="mt-4 space-y-3">
                {byCategory.map((c) => (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/85">{c.category}</span>
                      <span className="font-semibold tabular-nums">{gbp(c.amount)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', catColor(c.category))} style={{ width: `${(c.amount / maxCat) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-lg border border-brand-cyan/20 bg-brand-cyan/5 p-3 text-xs text-muted-foreground">
              Logged expenses roll into the <span className="font-medium text-foreground">Overheads</span> line on the P&amp;L for {locationName(locationId)}.
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Receipt className="h-4 w-4 text-muted-foreground" /> Logged expenses</CardTitle></CardHeader>
            <CardContent className="pt-0">
              {loading ? <Skeleton className="h-64 w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      {locationId === 'all' && <TableHead>Location</TableHead>}
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-muted-foreground">{e.date}</TableCell>
                        <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                        <TableCell className="font-medium">{e.vendor}<div className="text-xs text-muted-foreground">{e.note}</div></TableCell>
                        {locationId === 'all' && <TableCell className="text-muted-foreground">{e.location}</TableCell>}
                        <TableCell className="text-right font-semibold tabular-nums">{gbp(Number(e.amount))}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setForm({ ...e, amount: String(e.amount) })} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-brand-cyan"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => remove(e.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </TableCell>
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
