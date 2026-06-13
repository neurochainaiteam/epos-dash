// =============================================================================
// DATABASE LAYER — Supabase query functions.
//
// Each exported function mirrors its mockData.js counterpart in name and return
// shape. Pages import from here instead of mockData; loading/error handling
// lives in the useQuery hook.  When locationId is ALL_LOCATIONS_ID ('all') we
// fetch all rows and aggregate in JS, matching the existing mockData behaviour.
// =============================================================================

import { supabase } from '@/lib/supabase'
import { LOCATIONS, ALL_LOCATIONS_ID } from '@/data/mockData'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TODAY = new Date().toISOString().slice(0, 10)     // 'YYYY-MM-DD'

function loc(locationId) {
  return locationId === ALL_LOCATIONS_ID ? null : locationId
}

function ok(data) { return { data, error: null } }
function err(e)   { return { data: null, error: e } }

// Aggregate an array of daily_snapshots rows into a single company-wide KPI object.
function aggregateSnapshots(rows) {
  if (!rows?.length) return null
  const sum = rows.reduce(
    (s, r) => ({
      revenue:   s.revenue   + Number(r.revenue),
      cogs:      s.cogs      + Number(r.cogs),
      labour:    s.labour    + Number(r.labour),
      overheads: s.overheads + Number(r.overheads),
      order_count: s.order_count + Number(r.order_count),
    }),
    { revenue: 0, cogs: 0, labour: 0, overheads: 0, order_count: 0 },
  )
  return {
    ...sum,
    netProfit: sum.revenue - sum.cogs - sum.labour - sum.overheads,
    avgOrderValue: sum.order_count ? sum.revenue / sum.order_count : 0,
    // Aggregate deltas — simple average of per-location %s
    revenue_delta:    rows.reduce((s, r) => s + Number(r.revenue_delta   || 0), 0) / rows.length,
    cogs_delta:       rows.reduce((s, r) => s + Number(r.cogs_delta       || 0), 0) / rows.length,
    labour_delta:     rows.reduce((s, r) => s + Number(r.labour_delta     || 0), 0) / rows.length,
    overheads_delta:  rows.reduce((s, r) => s + Number(r.overheads_delta  || 0), 0) / rows.length,
    net_profit_delta: rows.reduce((s, r) => s + Number(r.net_profit_delta || 0), 0) / rows.length,
    order_count_delta:rows.reduce((s, r) => s + Number(r.order_count_delta|| 0), 0) / rows.length,
  }
}

// ---------------------------------------------------------------------------
// DASHBOARD — KPIs, deltas, hourly revenue, best sellers
// ---------------------------------------------------------------------------

export async function fetchDailySnapshot(locationId) {
  if (locationId === ALL_LOCATIONS_ID) {
    const { data, error } = await supabase
      .from('daily_snapshots')
      .select('*')
      .eq('date', TODAY)
    if (error) return err(error)
    return ok(aggregateSnapshots(data))
  }
  const { data, error } = await supabase
    .from('daily_snapshots')
    .select('*')
    .eq('location_id', locationId)
    .eq('date', TODAY)
    .maybeSingle()
  if (error) return err(error)
  if (!data) return ok(null)
  return ok({
    ...data,
    netProfit: Number(data.revenue) - Number(data.cogs) - Number(data.labour) - Number(data.overheads),
    avgOrderValue: data.order_count ? Number(data.revenue) / Number(data.order_count) : 0,
  })
}

export async function fetchHourlyRevenue(locationId) {
  let q = supabase
    .from('hourly_revenue')
    .select('hour, revenue, orders')
    .eq('date', TODAY)
    .order('hour')
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  if (locationId === ALL_LOCATIONS_ID) {
    // Aggregate hours across all locations
    const map = new Map()
    ;(data || []).forEach((r) => {
      const cur = map.get(r.hour) || { hour: r.hour, revenue: 0, orders: 0 }
      cur.revenue += Number(r.revenue)
      cur.orders  += Number(r.orders)
      map.set(r.hour, cur)
    })
    return ok([...map.values()].sort((a, b) => a.hour.localeCompare(b.hour)))
  }
  return ok((data || []).map((r) => ({ ...r, revenue: Number(r.revenue), orders: Number(r.orders) })))
}

export async function fetchBestSellers(locationId) {
  let q = supabase
    .from('best_sellers')
    .select('name, qty, revenue, rank')
    .eq('date', TODAY)
    .order('rank')
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  if (locationId === ALL_LOCATIONS_ID) {
    const map = new Map()
    ;(data || []).forEach((r) => {
      const cur = map.get(r.name) || { name: r.name, qty: 0, revenue: 0 }
      cur.qty     += Number(r.qty)
      cur.revenue += Number(r.revenue)
      map.set(r.name, cur)
    })
    const sorted = [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    return ok(sorted)
  }
  return ok(
    (data || [])
      .slice(0, 5)
      .map((r) => ({ ...r, qty: Number(r.qty), revenue: Number(r.revenue) })),
  )
}

export async function fetchRevenueByDay(locationId) {
  // Last 7 rows per location, ordered by date ascending so charts read left→right.
  let q = supabase
    .from('daily_revenue_series')
    .select('day_label, revenue, cogs, labour')
    .order('date', { ascending: true })
    .limit(locationId === ALL_LOCATIONS_ID ? 7 * LOCATIONS.length : 7)
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  if (locationId === ALL_LOCATIONS_ID) {
    // Average matching day labels across locations
    const map = new Map()
    ;(data || []).forEach((r) => {
      const cur = map.get(r.day_label) || { day: r.day_label, revenue: 0, cogs: 0, labour: 0, _n: 0 }
      cur.revenue += Number(r.revenue)
      cur.cogs    += Number(r.cogs)
      cur.labour  += Number(r.labour)
      cur._n      += 1
      map.set(r.day_label, cur)
    })
    return ok([...map.values()].map(({ _n, ...r }) => r))
  }
  return ok((data || []).map((r) => ({
    day: r.day_label,
    revenue: Number(r.revenue),
    cogs:    Number(r.cogs),
    labour:  Number(r.labour),
  })))
}

// ---------------------------------------------------------------------------
// ORDERS
// ---------------------------------------------------------------------------

export async function fetchOrders(locationId) {
  let q = supabase
    .from('orders')
    .select('id, location_id, reference, date, time, items, qty, total, payment, channel')
    .eq('date', TODAY)
    .order('time', { ascending: false })
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  // Map to the shape components expect (id = display ref, location = name)
  return ok(
    (data || []).map((o) => {
      const locRow = LOCATIONS.find((l) => l.id === o.location_id)
      return {
        id:       o.reference,
        time:     o.time?.slice(0, 5) ?? '',
        items:    o.items,
        qty:      o.qty,
        total:    Number(o.total),
        payment:  o.payment,
        channel:  o.channel,
        location: locRow?.name ?? o.location_id,
        _uuid:    o.id,
      }
    }),
  )
}

export async function insertOrder(locationId, order) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      location_id: locationId,
      reference:   order.id || `#${Date.now()}`,
      date:        TODAY,
      time:        order.time,
      items:       order.items,
      qty:         order.qty,
      total:       order.total,
      payment:     order.payment,
      channel:     order.channel || 'In-store',
    })
    .select()
    .single()
  return { data, error }
}

// ---------------------------------------------------------------------------
// P&L  (uses daily_snapshots + daily_revenue_series for period scaling)
// ---------------------------------------------------------------------------

export async function fetchPnL(locationId, period = 'day') {
  const { data: snap, error } = await fetchDailySnapshot(locationId)
  if (error) return err(error)
  if (!snap)  return ok(null)

  const mult = period === 'month' ? 27.4 : period === 'week' ? 6.4 : 1
  const revenue     = snap.revenue     * mult
  const cogs        = snap.cogs        * mult
  const labour      = snap.labour      * mult
  const overheads   = snap.overheads   * mult
  const grossProfit = revenue - cogs
  const netProfit   = grossProfit - labour - overheads
  const p = (v) => (revenue ? (v / revenue) * 100 : 0)

  return ok({
    period,
    rows: [
      { label: 'Revenue (net of VAT)',          amount: revenue,     pct: 100,           kind: 'revenue'  },
      { label: 'Cost of goods sold',             amount: -cogs,       pct: -p(cogs),      kind: 'cost'     },
      { label: 'Gross profit',                   amount: grossProfit, pct: p(grossProfit), kind: 'subtotal' },
      { label: 'Labour cost',                    amount: -labour,     pct: -p(labour),    kind: 'cost'     },
      { label: 'Overheads (rent, utilities, etc.)', amount: -overheads, pct: -p(overheads), kind: 'cost'   },
      { label: 'Net profit',                     amount: netProfit,   pct: p(netProfit),  kind: 'total'    },
    ],
    totals: { revenue, cogs, labour, overheads, grossProfit, netProfit },
  })
}

export async function fetchLabourTrend(locationId) {
  const { data, error } = await fetchRevenueByDay(locationId)
  if (error) return err(error)
  return ok(
    (data || []).map((d) => ({
      day:       d.day,
      labourPct: d.revenue ? (d.labour / d.revenue) * 100 : 0,
      foodPct:   d.revenue ? (d.cogs   / d.revenue) * 100 : 0,
    })),
  )
}

// ---------------------------------------------------------------------------
// INVENTORY
// ---------------------------------------------------------------------------

export async function fetchInventory(locationId) {
  let q = supabase
    .from('inventory_items')
    .select('*, location_id')
    .order('name')
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((i) => {
      const locRow = LOCATIONS.find((l) => l.id === i.location_id)
      return {
        id:           i.id,
        name:         i.name,
        unit:         i.unit,
        inStock:      Number(i.in_stock),
        par:          Number(i.par),
        cost:         Number(i.cost),
        supplier:     i.supplier_name,
        location:     locRow?.name ?? i.location_id,
        reorderPoint: Math.round(Number(i.par) * 0.4),
        value:        Math.round(Number(i.in_stock) * Number(i.cost) * 100) / 100,
      }
    }),
  )
}

export async function updateInventoryItem(id, patch) {
  const dbPatch = {}
  if (patch.inStock  !== undefined) dbPatch.in_stock      = patch.inStock
  if (patch.par      !== undefined) dbPatch.par            = patch.par
  if (patch.cost     !== undefined) dbPatch.cost           = patch.cost
  dbPatch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('inventory_items')
    .update(dbPatch)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ---------------------------------------------------------------------------
// RECIPES
// ---------------------------------------------------------------------------

export async function fetchRecipes(locationId) {
  let q = supabase
    .from('recipes')
    .select('*, location_id')
    .order('dish')
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((r) => {
      const locRow = LOCATIONS.find((l) => l.id === r.location_id)
      const price       = Number(r.price)
      const portionCost = Number(r.portion_cost)
      return {
        dish:         r.dish,
        price,
        portionCost,
        ingredients:  r.ingredients || [],
        location:     locRow?.name ?? r.location_id,
        margin:       price ? ((price - portionCost) / price) * 100 : 0,
        foodCostPct:  price ? (portionCost / price) * 100 : 0,
      }
    }),
  )
}

// ---------------------------------------------------------------------------
// WASTE
// ---------------------------------------------------------------------------

const WASTE_RECIPE_MAP = {
  'pizza dough balls': 'Dough prep (shared)',
  mozzarella: 'Cheese topping (shared)',
  'mozzarella sticks': 'Mozzarella Sticks (6)',
  'margherita 12"': 'Margherita (12")',
  'hawaiian 12"': 'Hawaiian (12")',
  pepperoni: 'Pepperoni (12")',
  'garlic bread': 'Garlic Bread',
  'loaded fries': 'Loaded Fries',
  'french fries': 'Loaded Fries',
  'mixed peppers': 'Vegetable Supreme (12")',
  'chicken wings': 'Chicken Wings (6)',
  ham: 'Hawaiian (12")',
}

function wasteRecipeFor(itemName) {
  const key = String(itemName).toLowerCase().trim()
  if (WASTE_RECIPE_MAP[key]) return WASTE_RECIPE_MAP[key]
  const hit = Object.keys(WASTE_RECIPE_MAP).find((k) => key.includes(k))
  return hit ? WASTE_RECIPE_MAP[hit] : 'Other / prep'
}

export async function fetchWaste(locationId) {
  let q = supabase
    .from('waste_log')
    .select('*, location_id')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((w) => {
      const locRow = LOCATIONS.find((l) => l.id === w.location_id)
      return {
        id:       w.id,
        date:     w.date,
        item:     w.item,
        qty:      w.qty,
        reason:   w.reason,
        cost:     Number(w.cost),
        location: locRow?.name ?? w.location_id,
        recipe:   wasteRecipeFor(w.item),
      }
    }),
  )
}

export async function insertWasteEntry(locationId, entry) {
  const { data, error } = await supabase
    .from('waste_log')
    .insert({
      location_id: locationId,
      date:        entry.date || TODAY,
      item:        entry.item,
      qty:         entry.qty,
      reason:      entry.reason,
      cost:        entry.cost,
    })
    .select()
    .single()
  return { data, error }
}

// ---------------------------------------------------------------------------
// STAFF
// ---------------------------------------------------------------------------

export async function fetchStaff(locationId) {
  // Staff is single-location only; 'all' falls back to first location.
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .eq('location_id', id)
    .order('name')
  if (error) return err(error)
  return ok(
    (data || []).map((s) => ({
      id:       s.id,
      name:     s.name,
      role:     s.role,
      wage:     Number(s.wage),
      contract: s.contract,
      shifts:   s.shifts || {},
    })),
  )
}

// ---------------------------------------------------------------------------
// TIME OFF / SCHEDULE
// ---------------------------------------------------------------------------

export async function fetchTimeOff(locationId) {
  let q = supabase
    .from('time_off')
    .select('*, location_id')
    .order('created_at', { ascending: false })
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((t) => {
      const locRow = LOCATIONS.find((l) => l.id === t.location_id)
      return {
        id:       t.id,
        name:     t.staff_name,
        role:     t.role,
        type:     t.type,
        status:   t.status,
        label:    t.label,
        weekDays: t.week_days || [],
        days:     t.days,
        location: locRow?.name ?? t.location_id,
      }
    }),
  )
}

export async function insertTimeOff(locationId, entry) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const { data, error } = await supabase
    .from('time_off')
    .insert({
      location_id: id,
      staff_name:  entry.name,
      role:        entry.role || '',
      type:        entry.type,
      status:      entry.status,
      label:       entry.label,
      week_days:   entry.weekDays || [],
      days:        entry.days || 0,
    })
    .select()
    .single()
  return { data, error }
}

// ---------------------------------------------------------------------------
// BOOKINGS
// ---------------------------------------------------------------------------

export async function fetchBookings(locationId) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const { data, error } = await supabase
    .from('bookings')
    .select('*, location_id')
    .eq('location_id', id)
    .eq('date', TODAY)
    .order('time')
  if (error) return err(error)

  return ok(
    (data || []).map((b) => ({
      id:     b.id,
      time:   b.time?.slice(0, 5) ?? '',
      name:   b.name,
      size:   b.size,
      table:  b.table_ref,
      phone:  b.phone,
      status: b.status,
    })),
  )
}

export async function updateBookingStatus(id, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ---------------------------------------------------------------------------
// CHECKLIST COMPLETIONS
// ---------------------------------------------------------------------------

export async function fetchChecklistHistory(locationId) {
  let q = supabase
    .from('checklist_completions')
    .select('*, location_id')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((h) => {
      const locRow = LOCATIONS.find((l) => l.id === h.location_id)
      return {
        date:     h.date,
        section:  h.section,
        by:       h.completed_by,
        at:       h.completed_at,
        done:     h.done,
        total:    h.total,
        location: locRow?.name ?? h.location_id,
      }
    }),
  )
}

export async function insertChecklistCompletion(locationId, entry) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const { data, error } = await supabase
    .from('checklist_completions')
    .insert({
      location_id:  id,
      date:         TODAY,
      section:      entry.section,
      completed_by: entry.by,
      completed_at: entry.at,
      done:         entry.done,
      total:        entry.total,
    })
    .select()
    .single()
  return { data, error }
}

// ---------------------------------------------------------------------------
// CHECKLIST SCHEDULES
// ---------------------------------------------------------------------------

export async function fetchChecklistSchedules() {
  const { data, error } = await supabase
    .from('checklist_schedules')
    .select('*')
    .order('section')
  if (error) return err(error)
  return ok(data || [])
}

export async function upsertChecklistSchedule(section, patch) {
  const { data, error } = await supabase
    .from('checklist_schedules')
    .upsert({ section, ...patch }, { onConflict: 'section' })
    .select()
    .single()
  return { data, error }
}

// ---------------------------------------------------------------------------
// EXPENSES
// ---------------------------------------------------------------------------

export async function fetchExpenses(locationId) {
  let q = supabase
    .from('expenses')
    .select('*, location_id')
    .order('date', { ascending: false })
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((e) => {
      const locRow = LOCATIONS.find((l) => l.id === e.location_id)
      return {
        id:       e.id,
        ref:      e.reference,
        date:     e.date,
        category: e.category,
        vendor:   e.vendor,
        amount:   Number(e.amount),
        note:     e.note,
        location: locRow?.name ?? e.location_id,
      }
    }),
  )
}

export async function fetchExpensesByCategory(locationId) {
  const { data, error } = await fetchExpenses(locationId)
  if (error) return err(error)
  const map = new Map()
  ;(data || []).forEach((e) => {
    map.set(e.category, (map.get(e.category) || 0) + e.amount)
  })
  return ok([...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount))
}

export async function upsertExpense(locationId, expense) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const row = {
    location_id: id,
    reference:   expense.ref || expense.reference || '',
    date:        expense.date,
    category:    expense.category,
    vendor:      expense.vendor,
    amount:      expense.amount,
    note:        expense.note || '',
  }
  if (expense.id && typeof expense.id === 'string' && expense.id.length === 36) {
    // existing row — update
    const { data, error } = await supabase
      .from('expenses')
      .update(row)
      .eq('id', expense.id)
      .select()
      .single()
    return { data, error }
  }
  const { data, error } = await supabase
    .from('expenses')
    .insert(row)
    .select()
    .single()
  return { data, error }
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  return { error }
}

// ---------------------------------------------------------------------------
// SMS CAMPAIGNS + CALL LOG (Marketing)
// ---------------------------------------------------------------------------

export async function fetchSmsCampaigns(locationId) {
  let q = supabase
    .from('sms_campaigns')
    .select('*, location_id')
    .order('date', { ascending: false })
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((c) => {
      const locRow = LOCATIONS.find((l) => l.id === c.location_id)
      return {
        id:        c.id,
        ref:       c.reference,
        name:      c.name,
        date:      c.date,
        audience:  c.audience,
        sent:      c.sent,
        delivered: c.delivered,
        opened:    c.opened,
        redeemed:  c.redeemed,
        status:    c.status,
        message:   c.message,
        location:  locRow?.name ?? c.location_id,
      }
    }),
  )
}

export async function insertSmsCampaign(locationId, campaign) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const { data, error } = await supabase
    .from('sms_campaigns')
    .insert({
      location_id: id,
      reference:   campaign.ref || '',
      name:        campaign.name,
      date:        campaign.date || TODAY,
      audience:    campaign.audience || '',
      sent:        campaign.sent || 0,
      delivered:   campaign.delivered || 0,
      opened:      campaign.opened || 0,
      redeemed:    campaign.redeemed || 0,
      status:      campaign.status || 'Draft',
      message:     campaign.message || '',
    })
    .select()
    .single()
  return { data, error }
}

export async function fetchCallLog(locationId) {
  let q = supabase
    .from('call_log')
    .select('*, location_id')
    .eq('date', TODAY)
    .order('time', { ascending: false })
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((c) => {
      const locRow = LOCATIONS.find((l) => l.id === c.location_id)
      return {
        time:        c.time?.slice(0, 5) ?? '',
        number:      c.number,
        name:        c.caller_name,
        durationSec: c.duration_sec,
        outcome:     c.outcome,
        type:        c.type,
        location:    locRow?.name ?? c.location_id,
      }
    }),
  )
}

// ---------------------------------------------------------------------------
// PLATFORM ACCOUNTS (Integrations)
// ---------------------------------------------------------------------------

export async function fetchChannelBreakdown(locationId) {
  const { data, error } = await fetchOrders(locationId)
  if (error) return err(error)
  const map = new Map()
  ;(data || []).forEach((o) => {
    const cur = map.get(o.channel) || { channel: o.channel, count: 0, revenue: 0 }
    cur.count   += 1
    cur.revenue += o.total
    map.set(o.channel, cur)
  })
  return ok([...map.values()].sort((a, b) => b.count - a.count))
}

export async function fetchPlatformAccounts(locationId) {
  let q = supabase
    .from('platform_accounts')
    .select('*, location_id')
    .order('platform')
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((a) => {
      const locRow = LOCATIONS.find((l) => l.id === a.location_id)
      return {
        id:          a.id,
        platform:    a.platform,
        accountName: a.account_name,
        storeId:     a.store_id,
        status:      a.status,
        ordersToday: a.orders_today,
        lastSync:    a.last_sync,
        location:    locRow?.name ?? a.location_id,
      }
    }),
  )
}

export async function updatePlatformAccount(id, patch) {
  const dbPatch = {}
  if (patch.status      !== undefined) dbPatch.status       = patch.status
  if (patch.ordersToday !== undefined) dbPatch.orders_today = patch.ordersToday
  if (patch.lastSync    !== undefined) dbPatch.last_sync    = patch.lastSync
  const { data, error } = await supabase
    .from('platform_accounts')
    .update(dbPatch)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function insertPlatformAccount(locationId, account) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const { data, error } = await supabase
    .from('platform_accounts')
    .insert({
      location_id:  id,
      platform:     account.platform,
      account_name: account.accountName || '',
      store_id:     account.storeId || '',
      status:       account.status || 'Action needed',
      orders_today: 0,
      last_sync:    '—',
    })
    .select()
    .single()
  return { data, error }
}

// ---------------------------------------------------------------------------
// SUPPLIERS
// ---------------------------------------------------------------------------

export async function fetchSupplier(name) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('name', name)
    .maybeSingle()
  if (error) return err(error)
  if (!data) return ok({ name, email: '—', phone: '—', leadDays: 3, account: '—' })
  return ok({ name: data.name, email: data.email, phone: data.phone, leadDays: data.lead_days, account: data.account_ref })
}

// ---------------------------------------------------------------------------
// INGREDIENT PRICE HISTORY
// ---------------------------------------------------------------------------

export async function fetchPriceHistory(locationId, itemName) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const { data, error } = await supabase
    .from('ingredient_price_history')
    .select('period, cost, supplier_name, source')
    .eq('location_id', id)
    .eq('item_name', itemName)
    .order('created_at')
  if (error) return err(error)
  return ok(
    (data || []).map((h) => ({
      period:   h.period,
      cost:     Number(h.cost),
      supplier: h.supplier_name,
      source:   h.source,
    })),
  )
}

export async function insertPriceHistoryLines(locationId, receipt) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const rows = receipt.lines.map((l) => ({
    location_id:   id,
    item_name:     l.name,
    period:        receipt.dateLabel,
    cost:          l.unitCost,
    supplier_name: receipt.supplier,
    source:        'Receipt OCR',
  }))
  const { data, error } = await supabase.from('ingredient_price_history').insert(rows).select()
  return { data, error }
}

// ---------------------------------------------------------------------------
// RECEIPTS
// ---------------------------------------------------------------------------

export async function fetchReceipts(locationId) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('location_id', id)
    .order('created_at', { ascending: false })
  if (error) return err(error)
  return ok(data || [])
}

export async function insertReceipt(locationId, scan) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      location_id:   id,
      reference:     scan.reference || '',
      supplier_name: scan.supplier  || '',
      date_label:    scan.dateLabel || '',
      currency:      scan.currency  || 'GBP',
      total:         scan.total     || 0,
      engine:        scan.engine    || '',
      lines:         scan.lines     || [],
    })
    .select()
    .single()
  return { data, error }
}

// ---------------------------------------------------------------------------
// ADVISOR DATA (feeds Recommendations + Forecasting engines)
// ---------------------------------------------------------------------------

export async function fetchIngredientTrends(locationId) {
  let q = supabase
    .from('ingredient_trends')
    .select('*, location_id')
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((t) => {
      const locRow = LOCATIONS.find((l) => l.id === t.location_id)
      return {
        name:     t.name,
        oldCost:  Number(t.old_cost),
        newCost:  Number(t.new_cost),
        unit:     t.unit,
        usedIn:   t.used_in,
        location: locRow?.name ?? t.location_id,
      }
    }),
  )
}

export async function fetchOrderModifiers(locationId) {
  let q = supabase
    .from('order_modifiers')
    .select('*, location_id')
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((m) => {
      const locRow = LOCATIONS.find((l) => l.id === m.location_id)
      return {
        base:           m.base_item,
        addon:          m.addon,
        count:          m.count,
        suggestion:     m.suggestion,
        suggestedPrice: Number(m.suggested_price),
        location:       locRow?.name ?? m.location_id,
      }
    }),
  )
}

export async function fetchClockIns(locationId) {
  let q = supabase
    .from('clock_ins')
    .select('*, location_id')
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((c) => {
      const locRow = LOCATIONS.find((l) => l.id === c.location_id)
      return {
        name:        c.staff_name,
        role:        c.role,
        lateCount:   c.late_count,
        avgLateMins: c.avg_late_mins,
        location:    locRow?.name ?? c.location_id,
      }
    }),
  )
}

export async function fetchHolidays(locationId) {
  let q = supabase
    .from('holidays')
    .select('*, location_id')
  if (locationId !== ALL_LOCATIONS_ID) q = q.eq('location_id', locationId)

  const { data, error } = await q
  if (error) return err(error)

  return ok(
    (data || []).map((h) => {
      const locRow = LOCATIONS.find((l) => l.id === h.location_id)
      return {
        name:     h.staff_name,
        role:     h.role,
        start:    h.start_date,
        end:      h.end_date,
        weeks:    h.weeks,
        location: locRow?.name ?? h.location_id,
      }
    }),
  )
}

// ---------------------------------------------------------------------------
// PERMISSION OVERRIDES (Supabase-backed alternative to localStorage)
// ---------------------------------------------------------------------------

export async function fetchPermissionOverrides() {
  const { data, error } = await supabase
    .from('permission_overrides')
    .select('role, page_key, allowed')
  if (error) return err(error)
  // Reshape to the { [role]: { [pageKey]: bool } } structure AppContext expects
  const map = {}
  ;(data || []).forEach(({ role, page_key, allowed }) => {
    if (!map[role]) map[role] = {}
    map[role][page_key] = allowed
  })
  return ok(map)
}

export async function upsertPermissionOverride(role, pageKey, allowed) {
  const { data, error } = await supabase
    .from('permission_overrides')
    .upsert({ role, page_key: pageKey, allowed }, { onConflict: 'role,page_key' })
    .select()
    .single()
  return { data, error }
}

export async function deletePermissionOverride(role, pageKey) {
  const { error } = await supabase
    .from('permission_overrides')
    .delete()
    .eq('role', role)
    .eq('page_key', pageKey)
  return { error }
}
