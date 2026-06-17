import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, PackageCheck, PackageX, Upload, ScanLine, Receipt, History,
  Send, Truck, X, Check, TrendingUp, TrendingDown, Sparkles, Image as ImageIcon, AlertCircle,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { simulateOcrScan } from '@/data/mockData'
import { gbp, cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import * as db from '@/lib/db'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

function stockState(item) {
  const ratio = item.inStock / item.par
  if (ratio < 0.4) return { label: 'Low', variant: 'destructive', bar: 'bg-destructive' }
  if (ratio < 0.7) return { label: 'Reorder soon', variant: 'warning', bar: 'bg-warning' }
  return { label: 'OK', variant: 'success', bar: 'bg-success' }
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={cn('max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card shadow-xl animate-fade-in sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-xl')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-5 py-3.5">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ---- Receipt upload + (simulated) OCR --------------------------------------
function ReceiptUpload({ locationId, onClose, onSaved }) {
  const [image, setImage] = useState(null)
  const [scan, setScan] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result)
    reader.readAsDataURL(file)
  }

  function runOcr() {
    setScanning(true)
    setTimeout(() => {
      setScan(simulateOcrScan(locationId))
      setScanning(false)
    }, 900)
  }

  function updateLine(idx, field, value) {
    setScan((s) => {
      const lines = s.lines.map((l, i) =>
        i === idx
          ? { ...l, [field]: Number(value) || 0, lineTotal: field === 'qty' ? Math.round((Number(value) || 0) * l.unitCost * 100) / 100 : field === 'unitCost' ? Math.round(l.qty * (Number(value) || 0) * 100) / 100 : l.lineTotal }
          : l
      )
      return { ...s, lines, total: Math.round(lines.reduce((t, l) => t + l.lineTotal, 0) * 100) / 100 }
    })
  }

  async function confirm() {
    setSaving(true)
    setSaveError(null)
    const { error: rcptErr } = await db.insertReceipt(locationId, { ...scan, image })
    if (rcptErr) { setSaveError(rcptErr.message); setSaving(false); return }
    const { error: phErr } = await db.insertPriceHistoryLines(locationId, scan)
    if (phErr) { setSaveError(phErr.message); setSaving(false); return }
    setSaving(false)
    onSaved(scan)
  }

  return (
    <Modal title="Upload supplier receipt" onClose={onClose} wide={!!scan}>
      {!scan ? (
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-background/40 px-6 py-10 text-center transition-colors hover:border-brand-cyan/50">
            {image ? (
              <img src={image} alt="Receipt preview" className="max-h-48 rounded-lg" />
            ) : (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyanText"><ImageIcon className="h-6 w-6" /></span>
                <div>
                  <div className="text-sm font-semibold text-foreground">Drop a receipt photo or click to upload</div>
                  <div className="text-xs text-muted-foreground">JPG/PNG — a supplier invoice or till receipt</div>
                </div>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-brand-cyanText" /> OCR engine ready — swap in a real model later</span>
            <div className="flex gap-2">
              {!image && <Button size="sm" variant="outline" onClick={() => setImage('sample')}>Use sample receipt</Button>}
              <Button size="sm" onClick={runOcr} disabled={scanning}>
                <ScanLine className={cn('h-3.5 w-3.5', scanning && 'animate-pulse')} /> {scanning ? 'Scanning…' : 'Scan with OCR'}
              </Button>
            </div>
          </div>
          {image === 'sample' && <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-center text-xs text-muted-foreground">Sample receipt selected — click "Scan with OCR".</div>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-cyan/20 bg-brand-cyan/5 p-3">
            <div className="text-sm">
              <span className="font-semibold text-foreground">{scan.supplier}</span>
              <span className="text-muted-foreground"> · {scan.reference} · {scan.dateLabel}</span>
            </div>
            <Badge variant="accent" className="gap-1"><ScanLine className="h-3 w-3" /> {scan.engine}</Badge>
          </div>
          {saveError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> {saveError}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Check the scanned lines, adjust if needed, then confirm. Prices update the per-ingredient price history.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2">Item</th><th className="py-2">Qty</th><th className="py-2">Unit £</th><th className="py-2">Change</th><th className="py-2 text-right">Line</th>
                </tr>
              </thead>
              <tbody>
                {scan.lines.map((l, idx) => {
                  const delta = l.oldCost ? Math.round(((l.unitCost - l.oldCost) / l.oldCost) * 100) : 0
                  return (
                    <tr key={idx} className="border-b">
                      <td className="py-2 pr-2 font-medium text-foreground">{l.name}{l.matched && <Check className="ml-1 inline h-3 w-3 text-success" />}</td>
                      <td className="py-2 pr-2"><input value={l.qty} onChange={(e) => updateLine(idx, 'qty', e.target.value)} className="h-7 w-14 rounded border bg-background px-1.5 text-sm tabular-nums" /> <span className="text-xs text-muted-foreground">{l.unit}</span></td>
                      <td className="py-2 pr-2"><input value={l.unitCost} onChange={(e) => updateLine(idx, 'unitCost', e.target.value)} className="h-7 w-16 rounded border bg-background px-1.5 text-sm tabular-nums" /></td>
                      <td className="py-2 pr-2">
                        {delta !== 0 && (
                          <span className={cn('inline-flex items-center gap-0.5 text-xs', delta > 0 ? 'text-destructive' : 'text-success')}>
                            {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{delta > 0 ? '+' : ''}{delta}%
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right font-semibold tabular-nums">{gbp(l.lineTotal, { decimals: 2 })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Receipt total</span>
            <span className="text-lg font-bold tabular-nums text-foreground">{gbp(scan.total, { decimals: 2 })}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setScan(null)}>Re-scan</Button>
            <Button size="sm" onClick={confirm} disabled={saving}>
              <Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Confirm & save'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ---- Price history per ingredient ------------------------------------------
function PriceHistory({ locationId, item, onClose }) {
  const { data: history, loading } = useQuery(
    () => db.fetchPriceHistory(locationId, item.name),
    [locationId, item.name],
  )
  const hist = history || []
  const max = Math.max(...hist.map((h) => h.cost), 1)
  const min = Math.min(...hist.map((h) => h.cost), 0)
  const first = hist[0]?.cost
  const last  = hist[hist.length - 1]?.cost
  const delta = first ? Math.round(((last - first) / first) * 100) : 0

  return (
    <Modal title={`Price history · ${item.name}`} onClose={onClose}>
      <div className="space-y-4">
        {loading ? <Skeleton className="h-40 w-full" /> : (<>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold tabular-nums text-foreground">{gbp(last ?? 0, { decimals: 2 })}<span className="text-sm font-normal text-muted-foreground">/{item.unit}</span></div>
              <div className="text-xs text-muted-foreground">{item.supplier}</div>
            </div>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold', delta > 0 ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success')}>
              {delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{delta > 0 ? '+' : ''}{delta}% over period
            </span>
          </div>
          {hist.length > 0 && (
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {hist.map((h, i) => {
                const range = max - min || 1
                const hgt = 24 + ((h.cost - min) / range) * 80
                const isNew = h.source?.includes('OCR')
                return (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${h.period}: ${gbp(h.cost, { decimals: 2 })} (${h.source})`}>
                    <span className="text-[10px] tabular-nums text-muted-foreground">{gbp(h.cost, { decimals: 2 })}</span>
                    <div className={cn('w-full rounded-md', isNew ? 'bg-brand-magenta' : i === hist.length - 1 ? 'bg-brand-gradient' : 'bg-brand-cyan/50')} style={{ height: hgt }} />
                    <span className="text-[10px] text-muted-foreground">{h.period?.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
          )}
          <div className="space-y-1.5">
            {hist.map((h, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{h.period}</span>
                <div className="flex items-center gap-3">
                  <Badge variant={h.source?.includes('OCR') ? 'accent' : 'secondary'}>{h.source}</Badge>
                  <span className="font-semibold tabular-nums text-foreground">{gbp(h.cost, { decimals: 2 })}</span>
                </div>
              </div>
            ))}
            {hist.length === 0 && <p className="text-sm text-muted-foreground">No price history recorded yet.</p>}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Receipt className="h-3.5 w-3.5" /> New prices captured from scanned receipts appear here automatically (magenta).</p>
        </>)}
      </div>
    </Modal>
  )
}

// ---- Draft supplier orders (semi-automated reordering) ---------------------
function DraftOrders({ items, onClose }) {
  const [supplierInfo, setSupplierInfo] = useState({})
  const [sent, setSent] = useState({})

  const groups = useMemo(() => {
    const lowItems = items.filter((i) => i.inStock <= i.reorderPoint || i.inStock / i.par < 0.45)
    const map = new Map()
    for (const it of lowItems) {
      const qty = Math.max(1, Math.ceil(it.par - it.inStock))
      const line = { name: it.name, qty, unit: it.unit, unitCost: it.cost, lineTotal: Math.round(qty * it.cost * 100) / 100 }
      const g = map.get(it.supplier) || { supplier: it.supplier, lines: [] }
      g.lines.push(line)
      map.set(it.supplier, g)
    }
    return [...map.values()].map((g) => ({ ...g, total: Math.round(g.lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100 }))
  }, [items])

  useEffect(() => {
    groups.forEach(async (g) => {
      if (supplierInfo[g.supplier]) return
      const { data } = await db.fetchSupplier(g.supplier)
      if (data) setSupplierInfo((prev) => ({ ...prev, [g.supplier]: data }))
    })
  }, [groups])

  return (
    <Modal title="Draft supplier orders" onClose={onClose} wide>
      <p className="mb-4 text-sm text-muted-foreground">
        Items at or below their reorder point, grouped by supplier. Review, then send — each order is drafted automatically and tied to the supplier on the item.
      </p>
      {groups.length === 0 && <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Nothing needs reordering right now.</div>}
      <div className="space-y-4">
        {groups.map((g) => {
          const info = supplierInfo[g.supplier] || {}
          return (
            <Card key={g.supplier} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyanText"><Truck className="h-4 w-4" /></span>
                  <div>
                    <div className="text-sm font-bold text-foreground">{g.supplier}</div>
                    <div className="text-xs text-muted-foreground">
                      {info.email || '—'} · lead time {info.leadDays ?? '?'} day{info.leadDays === 1 ? '' : 's'} · acct {info.account || '—'}
                    </div>
                  </div>
                </div>
                {sent[g.supplier] ? (
                  <Badge variant="success" className="gap-1"><Check className="h-3 w-3" /> Order sent</Badge>
                ) : (
                  <Button size="sm" onClick={() => setSent((s) => ({ ...s, [g.supplier]: true }))}><Send className="h-3.5 w-3.5" /> Send order · {gbp(g.total, { decimals: 2 })}</Button>
                )}
              </div>
              <div className="divide-y divide-border/60">
                {g.lines.map((l) => (
                  <div key={l.name} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="text-foreground">{l.name}</span>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="tabular-nums">{l.qty} {l.unit} × {gbp(l.unitCost, { decimals: 2 })}</span>
                      <span className="w-16 text-right font-semibold tabular-nums text-foreground">{gbp(l.lineTotal, { decimals: 2 })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Sending is simulated for this preview — wire to supplier email / EDI later.</p>
    </Modal>
  )
}

export default function Inventory() {
  const { locationId } = useApp()
  const [showUpload, setShowUpload] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [historyItem, setHistoryItem] = useState(null)
  const [toast, setToast] = useState(null)

  const { data: items, loading, error, refetch } = useQuery(
    () => db.fetchInventory(locationId),
    [locationId],
  )
  const allItems = items || []

  const { low, reorder, needsOrder, stockValue } = useMemo(() => ({
    low:        allItems.filter((i) => i.inStock / i.par < 0.4),
    reorder:    allItems.filter((i) => { const r = i.inStock / i.par; return r >= 0.4 && r < 0.7 }),
    needsOrder: allItems.filter((i) => i.inStock <= i.reorderPoint || i.inStock / i.par < 0.45),
    stockValue: allItems.reduce((s, i) => s + i.inStock * i.cost, 0),
  }), [allItems])

  return (
    <div>
      <PageHeader title="Inventory" description="Stock levels, receipt scanning & auto-reordering">
        <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}><Upload className="h-3.5 w-3.5" /> Upload receipt</Button>
        <Button size="sm" onClick={() => setShowOrders(true)}><Truck className="h-3.5 w-3.5" /> Auto-order ({needsOrder.length})</Button>
      </PageHeader>

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
            <Card className="p-4"><div className="text-xs text-muted-foreground">Tracked items</div><div className="mt-1 text-xl font-bold tabular-nums">{allItems.length}</div></Card>
            <Card className="p-4 ring-1 ring-destructive/20"><div className="flex items-center gap-1.5 text-xs text-destructive"><PackageX className="h-3.5 w-3.5" />Low stock</div><div className="mt-1 text-xl font-bold tabular-nums text-destructive">{low.length}</div></Card>
            <Card className="p-4"><div className="flex items-center gap-1.5 text-xs text-warning"><AlertTriangle className="h-3.5 w-3.5" />Reorder soon</div><div className="mt-1 text-xl font-bold tabular-nums">{reorder.length}</div></Card>
            <Card className="p-4"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><PackageCheck className="h-3.5 w-3.5" />Stock value</div><div className="mt-1 text-xl font-bold tabular-nums">{gbp(stockValue)}</div></Card>
          </div>
        )}

        {needsOrder.length > 0 && (
          <Card className="flex flex-wrap items-center justify-between gap-3 border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="text-sm">
                <span className="font-semibold text-destructive">{needsOrder.length} item{needsOrder.length === 1 ? '' : 's'} at or below reorder point.</span>{' '}
                <span className="text-foreground/80">A draft supplier order is ready for review.</span>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowOrders(true)}><Truck className="h-3.5 w-3.5" /> Review draft orders</Button>
          </Card>
        )}

        <Card>
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  {locationId === 'all' && <TableHead>Location</TableHead>}
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">In stock</TableHead>
                  <TableHead className="w-48">Level vs par</TableHead>
                  <TableHead className="text-right">Unit cost</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allItems.map((item, idx) => {
                  const st = stockState(item)
                  const ratio = Math.min(100, (item.inStock / item.par) * 100)
                  return (
                    <TableRow key={`${item.location}-${item.name}-${idx}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      {locationId === 'all' && <TableCell className="text-muted-foreground">{item.location}</TableCell>}
                      <TableCell className="text-muted-foreground">{item.supplier}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.inStock} <span className="text-muted-foreground">{item.unit}</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className={cn('h-full rounded-full', st.bar)} style={{ width: `${ratio}%` }} />
                          </div>
                          <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">{item.par}{item.unit.length < 4 ? item.unit : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{gbp(item.cost, { decimals: 2 })}</TableCell>
                      <TableCell className="text-right"><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <button onClick={() => setHistoryItem(item)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-brand-cyanText" title="Price history">
                          <History className="h-3.5 w-3.5" /> History
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {showUpload && (
        <ReceiptUpload
          locationId={locationId}
          onClose={() => setShowUpload(false)}
          onSaved={(scan) => {
            setShowUpload(false)
            setToast(`Receipt from ${scan.supplier} saved — ${scan.lines.length} prices updated.`)
            setTimeout(() => setToast(null), 4000)
            refetch()
          }}
        />
      )}
      {showOrders && <DraftOrders items={allItems} onClose={() => setShowOrders(false)} />}
      {historyItem && <PriceHistory locationId={locationId} item={historyItem} onClose={() => setHistoryItem(null)} />}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-brand-cyan/30 bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-glow-cyan animate-fade-in">
          <Check className="mr-1.5 inline h-4 w-4 text-success" />{toast}
        </div>
      )}
    </div>
  )
}
