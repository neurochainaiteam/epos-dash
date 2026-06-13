// ---------------------------------------------------------------------------
// CENTRAL MOCK DATA
//
// Everything the UI shows comes from this one file, structured per-location.
// Switching the active location in the sidebar changes which slice is read.
// When the real EPOS / accounting backend is wired up, replace the bodies of
// the selector functions at the bottom — the component contracts stay the same.
//
// All money is in GBP (£). Numbers are realistic for a UK pizza takeaway.
// ---------------------------------------------------------------------------

export const LOCATIONS = [
  {
    id: 'bham',
    name: 'Sparkhill',
    city: 'Birmingham',
    address: '142 Ladypool Road, Birmingham B12 8JS',
    cuisine: 'Pizza Takeaway',
  },
  {
    id: 'leic',
    name: 'Belgrave',
    city: 'Leicester',
    address: '7 Belgrave Gate, Leicester LE1 3GA',
    cuisine: 'Pizza Takeaway',
  },
  {
    id: 'cov',
    name: 'City Centre',
    city: 'Coventry',
    address: '33 Far Gosford Street, Coventry CV1 5DZ',
    cuisine: 'Pizza Takeaway',
  },
]

// Pseudo "today" used for labels across the mock UI.
export const TODAY_LABEL = 'Wed 10 Jun 2026'

// helper to build an hourly revenue curve with a lunch + dinner peak
function hourlyCurve(scale) {
  const shape = [
    ['11:00', 0.35], ['12:00', 0.72], ['13:00', 0.85], ['14:00', 0.5],
    ['15:00', 0.28], ['16:00', 0.3], ['17:00', 0.55], ['18:00', 0.82],
    ['19:00', 1.0], ['20:00', 0.95], ['21:00', 0.78], ['22:00', 0.46],
    ['23:00', 0.2],
  ]
  return shape.map(([hour, factor]) => ({
    hour,
    revenue: Math.round(scale * factor),
    orders: Math.max(1, Math.round(scale * factor * 0.057)),
  }))
}

// ---------------------------------------------------------------------------
// Per-location dataset
// ---------------------------------------------------------------------------

const DATA = {
  bham: {
    kpis: {
      revenue: 3240,
      cogs: 972,
      labour: 680,
      overheads: 415,
      get netProfit() {
        return this.revenue - this.cogs - this.labour - this.overheads
      },
      orderCount: 184,
      get avgOrderValue() {
        return this.revenue / this.orderCount
      },
    },
    // % change vs yesterday, for the little up/down deltas on KPI cards
    deltas: { revenue: 6.2, cogs: 1.1, labour: -2.4, overheads: 0, netProfit: 11.8, orderCount: 5.1 },
    revenueByHour: hourlyCurve(260),
    revenueByDay: [
      { day: 'Thu', revenue: 2980, cogs: 920, labour: 642 },
      { day: 'Fri', revenue: 4120, cogs: 1248, labour: 812 },
      { day: 'Sat', revenue: 4680, cogs: 1410, labour: 905 },
      { day: 'Sun', revenue: 3890, cogs: 1190, labour: 770 },
      { day: 'Mon', revenue: 2510, cogs: 790, labour: 588 },
      { day: 'Tue', revenue: 2740, cogs: 845, labour: 610 },
      { day: 'Wed', revenue: 3240, cogs: 972, labour: 680 },
    ],
    bestSellers: [
      { name: 'Pepperoni (12")', qty: 58, revenue: 638 },
      { name: 'Margherita (12")', qty: 44, revenue: 418 },
      { name: 'Meat Feast (12")', qty: 31, revenue: 419 },
      { name: 'Garlic Bread with Cheese', qty: 62, revenue: 279 },
      { name: 'BBQ Chicken (12")', qty: 28, revenue: 350 },
    ],
    orders: [
      { id: '#10248', time: '20:14', items: 'Pepperoni 12", Garlic Bread, Coke 1.5L', qty: 3, total: 17.5, payment: 'Card' },
      { id: '#10247', time: '20:02', items: 'Meat Feast 12", Potato Wedges', qty: 2, total: 18.0, payment: 'Card' },
      { id: '#10246', time: '19:51', items: 'Margherita 12", Margherita 12", Garlic Bread w/ Cheese', qty: 3, total: 23.5, payment: 'Cash' },
      { id: '#10245', time: '19:43', items: 'BBQ Chicken 12", Chicken Wings (6), Can', qty: 3, total: 19.2, payment: 'Card' },
      { id: '#10244', time: '19:30', items: 'Vegetable Supreme 12", Mozzarella Sticks', qty: 2, total: 16.0, payment: 'Card' },
      { id: '#10243', time: '19:18', items: 'Garlic Bread w/ Cheese, Coke 1.5L', qty: 2, total: 7.0, payment: 'Cash' },
      { id: '#10242', time: '19:05', items: 'Hawaiian 12", Potato Wedges', qty: 2, total: 15.5, payment: 'Card' },
      { id: '#10241', time: '18:52', items: 'Pepperoni 12", Can', qty: 2, total: 12.2, payment: 'Card' },
    ],
  },

  leic: {
    kpis: {
      revenue: 2180,
      cogs: 698,
      labour: 511,
      overheads: 360,
      get netProfit() {
        return this.revenue - this.cogs - this.labour - this.overheads
      },
      orderCount: 142,
      get avgOrderValue() {
        return this.revenue / this.orderCount
      },
    },
    deltas: { revenue: -3.1, cogs: 0.4, labour: 1.8, overheads: 0, netProfit: -9.2, orderCount: -1.4 },
    revenueByHour: hourlyCurve(175),
    revenueByDay: [
      { day: 'Thu', revenue: 2050, cogs: 660, labour: 498 },
      { day: 'Fri', revenue: 2810, cogs: 905, labour: 612 },
      { day: 'Sat', revenue: 3240, cogs: 1040, labour: 690 },
      { day: 'Sun', revenue: 2680, cogs: 858, labour: 560 },
      { day: 'Mon', revenue: 1740, cogs: 562, labour: 452 },
      { day: 'Tue', revenue: 1980, cogs: 638, labour: 470 },
      { day: 'Wed', revenue: 2180, cogs: 698, labour: 511 },
    ],
    bestSellers: [
      { name: 'Margherita (12")', qty: 49, revenue: 466 },
      { name: 'Pepperoni (12")', qty: 41, revenue: 451 },
      { name: 'Hawaiian (12")', qty: 26, revenue: 286 },
      { name: 'Loaded Fries', qty: 44, revenue: 198 },
      { name: 'Chicken Wings (6)', qty: 33, revenue: 182 },
    ],
    orders: [
      { id: '#08841', time: '20:09', items: 'Margherita 12", Loaded Fries', qty: 2, total: 14.0, payment: 'Card' },
      { id: '#08840', time: '19:55', items: 'Hawaiian 12", Garlic Bread, Coke 1.5L', qty: 3, total: 17.5, payment: 'Card' },
      { id: '#08839', time: '19:41', items: 'Pepperoni 12", Chicken Wings (6)', qty: 2, total: 16.5, payment: 'Cash' },
      { id: '#08838', time: '19:28', items: 'Loaded Fries, Can', qty: 2, total: 5.7, payment: 'Card' },
      { id: '#08837', time: '19:12', items: 'BBQ Chicken 12", Mozzarella Sticks', qty: 2, total: 17.0, payment: 'Card' },
      { id: '#08836', time: '18:58', items: 'Margherita 12", Garlic Bread w/ Cheese', qty: 2, total: 14.0, payment: 'Cash' },
    ],
  },

  cov: {
    kpis: {
      revenue: 1485,
      cogs: 520,
      labour: 396,
      overheads: 285,
      get netProfit() {
        return this.revenue - this.cogs - this.labour - this.overheads
      },
      orderCount: 121,
      get avgOrderValue() {
        return this.revenue / this.orderCount
      },
    },
    deltas: { revenue: 2.0, cogs: 2.6, labour: 0.5, overheads: 0, netProfit: 4.4, orderCount: 3.3 },
    revenueByHour: hourlyCurve(120),
    revenueByDay: [
      { day: 'Thu', revenue: 1360, cogs: 470, labour: 372 },
      { day: 'Fri', revenue: 2240, cogs: 800, labour: 520 },
      { day: 'Sat', revenue: 2580, cogs: 920, labour: 560 },
      { day: 'Sun', revenue: 1980, cogs: 700, labour: 470 },
      { day: 'Mon', revenue: 1180, cogs: 410, labour: 340 },
      { day: 'Tue', revenue: 1290, cogs: 448, labour: 358 },
      { day: 'Wed', revenue: 1485, cogs: 520, labour: 396 },
    ],
    bestSellers: [
      { name: 'Margherita (12")', qty: 38, revenue: 361 },
      { name: 'Pepperoni (12")', qty: 33, revenue: 363 },
      { name: 'Loaded Fries', qty: 41, revenue: 184 },
      { name: 'Meat Feast (12")', qty: 19, revenue: 257 },
      { name: 'Garlic Bread', qty: 47, revenue: 188 },
    ],
    orders: [
      { id: '#05512', time: '21:22', items: 'Pepperoni 12", Loaded Fries, Can', qty: 3, total: 16.7, payment: 'Card' },
      { id: '#05511', time: '21:08', items: 'Margherita 12", Garlic Bread', qty: 2, total: 13.5, payment: 'Cash' },
      { id: '#05510', time: '20:54', items: 'Meat Feast 12", Coke 1.5L', qty: 2, total: 16.0, payment: 'Card' },
      { id: '#05509', time: '20:40', items: 'Loaded Fries, Mozzarella Sticks', qty: 2, total: 9.0, payment: 'Cash' },
      { id: '#05508', time: '20:25', items: 'Margherita 12", Can', qty: 2, total: 10.7, payment: 'Card' },
    ],
  },
}

// ---------------------------------------------------------------------------
// Selectors — components import these, never DATA directly.
// `locationId === 'all'` produces a Director-only company-wide roll-up.
// ---------------------------------------------------------------------------

export const ALL_LOCATIONS_ID = 'all'

// ---------------------------------------------------------------------------
// Synthetic order history. The curated `orders` above are the latest few; this
// pads each location's feed to a few hundred rows so the Orders table behaves
// like a real, growing dataset (and exercises the virtualised table).
// Fully deterministic (index-derived, no randomness) so it never reshuffles.
// ---------------------------------------------------------------------------

const MENU_PIZZAS = [
  ['Margherita 12"', 9.5], ['Pepperoni 12"', 11.0], ['BBQ Chicken 12"', 12.5],
  ['Meat Feast 12"', 13.5], ['Hawaiian 12"', 11.0], ['Vegetable Supreme 12"', 11.5],
]
const MENU_SIDES = [
  ['Garlic Bread', 4.0], ['Garlic Bread w/ Cheese', 4.5], ['Loaded Fries', 4.5],
  ['Chicken Wings (6)', 5.5], ['Mozzarella Sticks (6)', 4.5], ['Potato Wedges', 4.5],
]
const MENU_DRINKS = [['Coke 1.5L', 2.5], ['Can', 1.2], ['Water', 1.0]]

const HISTORY_BASE_ID = { bham: 10240, leic: 8835, cov: 5507 }
const HISTORY_COUNT = 220

function generateOrderHistory(locId) {
  const baseId = HISTORY_BASE_ID[locId] ?? 9000
  const out = []
  for (let i = 0; i < HISTORY_COUNT; i++) {
    const pizza = MENU_PIZZAS[i % MENU_PIZZAS.length]
    const side = MENU_SIDES[(i * 3) % MENU_SIDES.length]
    const withDrink = i % 2 === 0
    const drink = MENU_DRINKS[(i * 5) % MENU_DRINKS.length]

    let items = `${pizza[0]}, ${side[0]}`
    let total = pizza[1] + side[1]
    let qty = 2
    if (withDrink) {
      items += `, ${drink[0]}`
      total += drink[1]
      qty = 3
    }

    // spread times across an 11:00–22:59 trading window
    const mins = 11 * 60 + ((i * 167) % (12 * 60))
    const hh = String(Math.floor(mins / 60)).padStart(2, '0')
    const mm = String(mins % 60).padStart(2, '0')

    out.push({
      id: `#${baseId - i}`,
      time: `${hh}:${mm}`,
      items,
      qty,
      total: Math.round(total * 100) / 100,
      payment: i % 10 < 7 ? 'Card' : 'Cash',
    })
  }
  return out
}

// built once at module load, then reused
const ORDER_HISTORY = {
  bham: generateOrderHistory('bham'),
  leic: generateOrderHistory('leic'),
  cov: generateOrderHistory('cov'),
}

function emptyKpis() {
  return { revenue: 0, cogs: 0, labour: 0, overheads: 0, netProfit: 0, orderCount: 0, avgOrderValue: 0 }
}

function aggregateKpis() {
  const sum = emptyKpis()
  for (const loc of LOCATIONS) {
    const k = DATA[loc.id].kpis
    sum.revenue += k.revenue
    sum.cogs += k.cogs
    sum.labour += k.labour
    sum.overheads += k.overheads
    sum.netProfit += k.netProfit
    sum.orderCount += k.orderCount
  }
  sum.avgOrderValue = sum.orderCount ? sum.revenue / sum.orderCount : 0
  return sum
}

function aggregateByKey(key) {
  // sum a per-day array (revenueByDay) across all locations
  const base = DATA[LOCATIONS[0].id][key].map((row) => ({ ...row }))
  for (let i = 1; i < LOCATIONS.length; i++) {
    DATA[LOCATIONS[i].id][key].forEach((row, idx) => {
      for (const k of Object.keys(row)) {
        if (typeof row[k] === 'number') base[idx][k] += row[k]
      }
    })
  }
  return base
}

function aggregateBestSellers() {
  const map = new Map()
  for (const loc of LOCATIONS) {
    for (const item of DATA[loc.id].bestSellers) {
      const cur = map.get(item.name) || { name: item.name, qty: 0, revenue: 0 }
      cur.qty += item.qty
      cur.revenue += item.revenue
      map.set(item.name, cur)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
}

export function getKpis(locationId) {
  if (locationId === ALL_LOCATIONS_ID) return aggregateKpis()
  return { ...DATA[locationId].kpis, netProfit: DATA[locationId].kpis.netProfit, avgOrderValue: DATA[locationId].kpis.avgOrderValue }
}

export function getDeltas(locationId) {
  if (locationId === ALL_LOCATIONS_ID) {
    return { revenue: 3.0, cogs: 1.2, labour: -0.8, overheads: 0, netProfit: 6.1, orderCount: 2.4 }
  }
  return DATA[locationId].deltas
}

export function getRevenueByHour(locationId) {
  if (locationId === ALL_LOCATIONS_ID) return aggregateByKey('revenueByHour')
  return DATA[locationId].revenueByHour
}

export function getRevenueByDay(locationId) {
  if (locationId === ALL_LOCATIONS_ID) return aggregateByKey('revenueByDay')
  return DATA[locationId].revenueByDay
}

export function getBestSellers(locationId) {
  if (locationId === ALL_LOCATIONS_ID) return aggregateBestSellers()
  return DATA[locationId].bestSellers
}

// Sales channel tagging — every order arrives via in-store EPOS or one of the
// connected delivery platforms (see PLATFORMS). Deterministic from the order id
// so the feed never reshuffles. Weighted to look like a real takeaway mix.
const ORDER_CHANNELS = [
  'In-store', 'In-store', 'In-store', 'Website',
  'Just Eat', 'Just Eat', 'Uber Eats', 'Uber Eats',
  'Deliveroo', 'Deliveroo', 'Foodhub', 'Website',
]
export function orderChannel(seed) {
  const n = String(seed).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return ORDER_CHANNELS[n % ORDER_CHANNELS.length]
}

export function getOrders(locationId) {
  const tag = (o, locName) => ({ ...o, location: locName, channel: o.channel || orderChannel(o.id) })
  if (locationId === ALL_LOCATIONS_ID) {
    return LOCATIONS.flatMap((loc) =>
      [...DATA[loc.id].orders, ...ORDER_HISTORY[loc.id]].map((o) => tag(o, loc.name)),
    )
  }
  const name = locationName(locationId)
  return [...DATA[locationId].orders, ...ORDER_HISTORY[locationId]].map((o) => tag(o, name))
}

export function locationName(locationId) {
  if (locationId === ALL_LOCATIONS_ID) return 'All locations'
  const loc = LOCATIONS.find((l) => l.id === locationId)
  return loc ? loc.name : ''
}

/** Derived headline metrics owners care about most. */
export function getHeadlineMetrics(locationId) {
  const k = getKpis(locationId)
  return {
    labourPct: k.revenue ? (k.labour / k.revenue) * 100 : 0,
    foodCostPct: k.revenue ? (k.cogs / k.revenue) * 100 : 0,
    netMarginPct: k.revenue ? (k.netProfit / k.revenue) * 100 : 0,
  }
}

// ---------------------------------------------------------------------------
// OPERATIONAL DATA (inventory / recipes / waste / staff+rota / bookings)
// Per-location so the location switcher changes every page.
// ---------------------------------------------------------------------------

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const OPS = {
  bham: {
    inventory: [
      { name: 'Pizza dough balls', unit: 'each', inStock: 120, par: 200, cost: 0.35, supplier: 'DoughPro' },
      { name: 'Mozzarella', unit: 'kg', inStock: 14, par: 40, cost: 6.2, supplier: 'Dairy Direct' },
      { name: 'Pizza sauce (passata)', unit: 'L', inStock: 22, par: 30, cost: 1.3, supplier: 'Italia Wholesale' },
      { name: 'Pepperoni', unit: 'kg', inStock: 7, par: 20, cost: 7.8, supplier: 'Italia Wholesale' },
      { name: 'Cooked chicken', unit: 'kg', inStock: 9, par: 18, cost: 6.5, supplier: 'Midlands Meats' },
      { name: 'Mixed peppers', unit: 'kg', inStock: 11, par: 15, cost: 2.4, supplier: 'Fresh Veg Co' },
      { name: 'Mushrooms', unit: 'kg', inStock: 6, par: 12, cost: 2.8, supplier: 'Fresh Veg Co' },
      { name: 'Pineapple (tinned)', unit: 'case', inStock: 3, par: 8, cost: 8.5, supplier: 'Italia Wholesale' },
      { name: 'French fries (frozen)', unit: 'kg', inStock: 28, par: 25, cost: 1.2, supplier: 'Catering Supplies' },
      { name: 'Chicken wings', unit: 'kg', inStock: 5, par: 15, cost: 4.5, supplier: 'Midlands Meats' },
      { name: 'Pizza boxes 12"', unit: 'box(100)', inStock: 2, par: 6, cost: 18, supplier: 'Pack-It' },
      { name: 'Cans of drink', unit: 'case(24)', inStock: 4, par: 10, cost: 9.6, supplier: 'Drinks Co' },
    ],
    recipes: [
      { dish: 'Margherita (12")', price: 9.5, portionCost: 2.3, ingredients: ['Dough ball', 'Mozzarella 120g', 'Pizza sauce 80ml', 'Basil'] },
      { dish: 'Pepperoni (12")', price: 11.0, portionCost: 2.95, ingredients: ['Dough ball', 'Mozzarella 120g', 'Pepperoni 60g', 'Sauce'] },
      { dish: 'BBQ Chicken (12")', price: 12.5, portionCost: 3.6, ingredients: ['Dough ball', 'Mozzarella', 'Chicken 90g', 'BBQ sauce'] },
      { dish: 'Meat Feast (12")', price: 13.5, portionCost: 4.2, ingredients: ['Dough ball', 'Mozzarella', 'Pepperoni', 'Chicken', 'Beef'] },
      { dish: 'Garlic Bread with Cheese', price: 4.5, portionCost: 1.1, ingredients: ['Dough ball', 'Garlic butter', 'Mozzarella 40g'] },
      { dish: 'Chicken Wings (6)', price: 5.5, portionCost: 2.1, ingredients: ['Chicken wings 6', 'Coating', 'Hot sauce'] },
    ],
    waste: [
      { date: '10 Jun', item: 'Pizza dough balls', qty: '8 each', reason: 'Over-prepped', cost: 2.8 },
      { date: '10 Jun', item: 'Margherita 12"', qty: '2 pizzas', reason: 'Order error', cost: 4.6 },
      { date: '9 Jun', item: 'Mozzarella', qty: '0.8 kg', reason: 'Expired', cost: 5.0 },
      { date: '9 Jun', item: 'Garlic bread', qty: '6 units', reason: 'Burnt', cost: 4.8 },
      { date: '8 Jun', item: 'Mixed peppers', qty: '1 kg', reason: 'Spoiled', cost: 2.4 },
      { date: '8 Jun', item: 'Chicken wings', qty: '1 kg', reason: 'Over-cooked', cost: 4.5 },
    ],
    staff: [
      { name: 'Aisha Khan', role: 'Front of House', wage: 11.8, contract: 'Part-time', shifts: { Mon: null, Tue: '16:00–23:00', Wed: '16:00–23:00', Thu: null, Fri: '16:00–23:30', Sat: '16:00–23:30', Sun: '15:00–22:00' } },
      { name: 'Daniel Osei', role: 'Branch Manager', wage: 16.5, contract: 'Full-time', shifts: { Mon: '11:00–20:00', Tue: '11:00–20:00', Wed: '11:00–20:00', Thu: '11:00–20:00', Fri: '14:00–23:30', Sat: '14:00–23:30', Sun: null } },
      { name: 'Marek Kowalski', role: 'Head Pizza Chef', wage: 14.0, contract: 'Full-time', shifts: { Mon: '15:00–23:00', Tue: '15:00–23:00', Wed: '15:00–23:00', Thu: null, Fri: '15:00–23:30', Sat: '15:00–23:30', Sun: '14:00–22:00' } },
      { name: 'Priya Patel', role: 'Pizza Chef', wage: 13.5, contract: 'Full-time', shifts: { Mon: '16:00–23:00', Tue: null, Wed: '16:00–23:00', Thu: '16:00–23:00', Fri: '16:00–23:30', Sat: '16:00–23:30', Sun: '15:00–22:00' } },
      { name: 'Tom Reeves', role: 'Delivery Driver', wage: 11.44, contract: 'Part-time', shifts: { Mon: null, Tue: '17:00–23:00', Wed: '17:00–23:00', Thu: '17:00–23:00', Fri: '17:00–23:30', Sat: '17:00–23:30', Sun: '16:00–22:00' } },
      { name: 'Sofia Alves', role: 'Kitchen Porter', wage: 11.44, contract: 'Part-time', shifts: { Mon: '17:00–22:00', Tue: '17:00–22:00', Wed: null, Thu: '17:00–22:00', Fri: '17:00–23:00', Sat: '17:00–23:00', Sun: null } },
    ],
    bookings: [
      { time: '18:00', name: 'Hussain (party)', size: 6, table: 'T4', phone: '07700 900181', status: 'Confirmed' },
      { time: '18:30', name: 'Walsh', size: 2, table: 'T1', phone: '07700 900142', status: 'Confirmed' },
      { time: '19:00', name: 'Begum', size: 4, table: 'T6', phone: '07700 900133', status: 'Seated' },
      { time: '19:30', name: 'Clarke', size: 3, table: 'T2', phone: '07700 900128', status: 'Confirmed' },
      { time: '20:00', name: 'Patel (birthday)', size: 8, table: 'T7+T8', phone: '07700 900119', status: 'Confirmed' },
      { time: '20:30', name: 'O’Brien', size: 2, table: 'T3', phone: '07700 900105', status: 'Pending' },
    ],
  },

  leic: {
    inventory: [
      { name: 'Pizza dough balls', unit: 'each', inStock: 150, par: 200, cost: 0.35, supplier: 'DoughPro' },
      { name: 'Mozzarella', unit: 'kg', inStock: 20, par: 40, cost: 6.2, supplier: 'Dairy Direct' },
      { name: 'Pizza sauce (passata)', unit: 'L', inStock: 9, par: 30, cost: 1.3, supplier: 'Italia Wholesale' },
      { name: 'Pepperoni', unit: 'kg', inStock: 11, par: 20, cost: 7.8, supplier: 'Italia Wholesale' },
      { name: 'Ham', unit: 'kg', inStock: 6, par: 15, cost: 5.4, supplier: 'Midlands Meats' },
      { name: 'Pineapple (tinned)', unit: 'case', inStock: 5, par: 8, cost: 8.5, supplier: 'Italia Wholesale' },
      { name: 'Sweetcorn (tinned)', unit: 'case', inStock: 4, par: 6, cost: 6.2, supplier: 'Italia Wholesale' },
      { name: 'French fries (frozen)', unit: 'kg', inStock: 18, par: 25, cost: 1.2, supplier: 'Catering Supplies' },
      { name: 'Mozzarella sticks (frozen)', unit: 'kg', inStock: 3, par: 10, cost: 5.2, supplier: 'Catering Supplies' },
      { name: 'Pizza boxes 12"', unit: 'box(100)', inStock: 4, par: 6, cost: 18, supplier: 'Pack-It' },
      { name: 'Cans of drink', unit: 'case(24)', inStock: 7, par: 10, cost: 9.6, supplier: 'Drinks Co' },
    ],
    recipes: [
      { dish: 'Margherita (12")', price: 9.5, portionCost: 2.3, ingredients: ['Dough ball', 'Mozzarella 120g', 'Pizza sauce 80ml', 'Basil'] },
      { dish: 'Hawaiian (12")', price: 11.0, portionCost: 3.05, ingredients: ['Dough ball', 'Mozzarella', 'Ham 50g', 'Pineapple'] },
      { dish: 'Pepperoni (12")', price: 11.0, portionCost: 2.95, ingredients: ['Dough ball', 'Mozzarella 120g', 'Pepperoni 60g', 'Sauce'] },
      { dish: 'Vegetable Supreme (12")', price: 11.5, portionCost: 3.1, ingredients: ['Dough ball', 'Mozzarella', 'Peppers', 'Mushrooms', 'Sweetcorn'] },
      { dish: 'Loaded Fries', price: 4.5, portionCost: 1.05, ingredients: ['Fries 300g', 'Mozzarella 40g', 'Garlic mayo'] },
      { dish: 'Mozzarella Sticks (6)', price: 4.5, portionCost: 1.4, ingredients: ['Mozzarella sticks 6', 'Dip'] },
    ],
    waste: [
      { date: '10 Jun', item: 'Pizza dough balls', qty: '6 each', reason: 'Over-prepped', cost: 2.1 },
      { date: '10 Jun', item: 'Hawaiian 12"', qty: '1 pizza', reason: 'Order error', cost: 3.1 },
      { date: '9 Jun', item: 'Loaded fries', qty: '2 kg', reason: 'End of day', cost: 2.4 },
      { date: '9 Jun', item: 'Mozzarella sticks', qty: '8 units', reason: 'Burnt', cost: 2.8 },
      { date: '8 Jun', item: 'Ham', qty: '0.5 kg', reason: 'Expired', cost: 2.7 },
    ],
    staff: [
      { name: 'Mei Lin', role: 'Front of House', wage: 11.6, contract: 'Part-time', shifts: { Mon: null, Tue: '16:00–23:00', Wed: '16:00–23:00', Thu: '16:00–23:00', Fri: '16:00–23:30', Sat: '16:00–23:30', Sun: null } },
      { name: 'Kevin Tran', role: 'Branch Manager', wage: 16.0, contract: 'Full-time', shifts: { Mon: '12:00–21:00', Tue: '12:00–21:00', Wed: '12:00–21:00', Thu: '12:00–21:00', Fri: '15:00–23:30', Sat: '15:00–23:30', Sun: null } },
      { name: 'Wei Chen', role: 'Pizza Chef', wage: 14.5, contract: 'Full-time', shifts: { Mon: '16:00–23:00', Tue: '16:00–23:00', Wed: null, Thu: '16:00–23:00', Fri: '16:00–23:30', Sat: '16:00–23:30', Sun: '15:00–22:00' } },
      { name: 'Jamie Doyle', role: 'Delivery Driver', wage: 11.44, contract: 'Part-time', shifts: { Mon: null, Tue: '17:00–23:00', Wed: '17:00–23:00', Thu: '17:00–23:00', Fri: '17:00–23:30', Sat: '17:00–23:30', Sun: '16:00–22:00' } },
      { name: 'Lucy Ward', role: 'Kitchen Porter', wage: 11.44, contract: 'Part-time', shifts: { Mon: '17:00–22:00', Tue: null, Wed: '17:00–22:00', Thu: '17:00–22:00', Fri: '17:00–23:00', Sat: '17:00–23:00', Sun: null } },
    ],
    bookings: [
      { time: '18:15', name: 'Nguyen', size: 4, table: 'T2', phone: '07700 900244', status: 'Confirmed' },
      { time: '18:45', name: 'Smith', size: 2, table: 'T1', phone: '07700 900231', status: 'Confirmed' },
      { time: '19:30', name: 'Cheng (party)', size: 6, table: 'T5', phone: '07700 900222', status: 'Seated' },
      { time: '20:00', name: 'Hill', size: 3, table: 'T3', phone: '07700 900210', status: 'Pending' },
    ],
  },

  cov: {
    inventory: [
      { name: 'Pizza dough balls', unit: 'each', inStock: 90, par: 200, cost: 0.35, supplier: 'DoughPro' },
      { name: 'Mozzarella', unit: 'kg', inStock: 8, par: 30, cost: 6.2, supplier: 'Dairy Direct' },
      { name: 'Pizza sauce (passata)', unit: 'L', inStock: 14, par: 25, cost: 1.3, supplier: 'Italia Wholesale' },
      { name: 'Pepperoni', unit: 'kg', inStock: 5, par: 15, cost: 7.8, supplier: 'Italia Wholesale' },
      { name: 'Beef mince', unit: 'kg', inStock: 6, par: 12, cost: 5.0, supplier: 'Midlands Meats' },
      { name: 'French fries (frozen)', unit: 'kg', inStock: 20, par: 25, cost: 1.2, supplier: 'Catering Supplies' },
      { name: 'Garlic butter', unit: 'kg', inStock: 3, par: 6, cost: 3.2, supplier: 'Catering Supplies' },
      { name: 'Pizza boxes 12"', unit: 'box(100)', inStock: 2, par: 5, cost: 18, supplier: 'Pack-It' },
      { name: 'Cans of drink', unit: 'case(24)', inStock: 5, par: 8, cost: 9.6, supplier: 'Drinks Co' },
    ],
    recipes: [
      { dish: 'Margherita (12")', price: 9.5, portionCost: 2.3, ingredients: ['Dough ball', 'Mozzarella 120g', 'Pizza sauce 80ml', 'Basil'] },
      { dish: 'Pepperoni (12")', price: 11.0, portionCost: 2.95, ingredients: ['Dough ball', 'Mozzarella 120g', 'Pepperoni 60g', 'Sauce'] },
      { dish: 'Meat Feast (12")', price: 13.5, portionCost: 4.2, ingredients: ['Dough ball', 'Mozzarella', 'Pepperoni', 'Beef', 'Chicken'] },
      { dish: 'Garlic Bread', price: 4.0, portionCost: 0.8, ingredients: ['Dough ball', 'Garlic butter'] },
      { dish: 'Loaded Fries', price: 4.5, portionCost: 1.05, ingredients: ['Fries 300g', 'Mozzarella 40g', 'Garlic mayo'] },
      { dish: 'Coca-Cola 1.5L', price: 2.5, portionCost: 1.0, ingredients: ['Coca-Cola 1.5L bottle'] },
    ],
    waste: [
      { date: '10 Jun', item: 'Pizza dough balls', qty: '5 each', reason: 'Over-prepped', cost: 1.8 },
      { date: '10 Jun', item: 'Garlic bread', qty: '8 units', reason: 'Stale', cost: 1.6 },
      { date: '9 Jun', item: 'French fries', qty: '2 kg', reason: 'End of day', cost: 2.4 },
      { date: '9 Jun', item: 'Pepperoni', qty: '0.4 kg', reason: 'Over-portioned', cost: 3.1 },
      { date: '8 Jun', item: 'Mozzarella', qty: '0.3 kg', reason: 'Spoiled', cost: 1.9 },
    ],
    staff: [
      { name: 'Yusuf Demir', role: 'Front of House', wage: 11.5, contract: 'Part-time', shifts: { Mon: '16:00–23:00', Tue: null, Wed: '16:00–23:00', Thu: '16:00–23:00', Fri: '16:00–00:00', Sat: '16:00–00:00', Sun: '16:00–22:00' } },
      { name: 'Rob Skinner', role: 'Branch Manager', wage: 15.5, contract: 'Full-time', shifts: { Mon: '14:00–22:00', Tue: '14:00–22:00', Wed: '14:00–22:00', Thu: '14:00–22:00', Fri: '16:00–00:00', Sat: '16:00–00:00', Sun: null } },
      { name: 'Hassan Ali', role: 'Pizza Chef', wage: 13.0, contract: 'Full-time', shifts: { Mon: '16:00–23:00', Tue: '16:00–23:00', Wed: null, Thu: '16:00–23:00', Fri: '16:00–00:00', Sat: '16:00–00:00', Sun: '16:00–22:00' } },
      { name: 'Chloe Bennett', role: 'Delivery Driver', wage: 11.44, contract: 'Part-time', shifts: { Mon: null, Tue: '17:00–23:00', Wed: '17:00–23:00', Thu: '17:00–23:00', Fri: '17:00–00:00', Sat: '17:00–00:00', Sun: '17:00–22:00' } },
    ],
    bookings: [
      { time: '19:00', name: 'Taylor', size: 4, table: 'T2', phone: '07700 900388', status: 'Confirmed' },
      { time: '20:00', name: 'Khan (party)', size: 5, table: 'T4', phone: '07700 900377', status: 'Pending' },
      { time: '20:30', name: 'Morris', size: 2, table: 'T1', phone: '07700 900360', status: 'Confirmed' },
    ],
  },
}

// Opening/closing/cleaning checklist template — shared across locations.
export const CHECKLIST_TEMPLATE = [
  {
    section: 'Opening',
    tasks: [
      'Unlock and disarm alarm',
      'Switch on pizza ovens and fryers to heat',
      'Check fridge & freezer temperatures (log readings)',
      'Float counted into till (£150)',
      'Prep dough, sauce and toppings for service',
      'Confirm online ordering & card machine are live',
    ],
  },
  {
    section: 'Closing',
    tasks: [
      'Cash up till and reconcile against EPOS',
      'Turn off and clean down ovens and fryers',
      'Store/label leftover prep, bin waste',
      'Empty bins and take out rubbish',
      'Set alarm and lock up',
    ],
  },
  {
    section: 'Cleaning',
    tasks: [
      'Scrape pizza ovens and clean stones',
      'Deep clean fryers and change oil if due',
      'Sanitise prep counters, peels and cutters',
      'Mop kitchen and front-of-house floors',
      'Clean customer toilets and restock',
    ],
  },
]

// ---- Operational selectors ------------------------------------------------

function opsField(locationId, field) {
  if (locationId === ALL_LOCATIONS_ID) {
    return LOCATIONS.flatMap((loc) =>
      OPS[loc.id][field].map((row) => ({ ...row, location: loc.name })),
    )
  }
  return OPS[locationId][field].map((row) => ({ ...row, location: locationName(locationId) }))
}

export function getInventory(locationId) {
  // reorderPoint = the level at which a draft supplier order is auto-suggested
  // (~40% of par — the same threshold the Inventory "Low" badge uses).
  return opsField(locationId, 'inventory').map((i) => ({
    ...i,
    id: `${i.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    reorderPoint: Math.round(i.par * 0.4),
    value: Math.round(i.inStock * i.cost * 100) / 100,
  }))
}

// ---- Waste → recipe attribution ------------------------------------------
// Map each logged waste line to the menu item it ultimately costs. Raw-prep
// items that feed several dishes are tagged "… (shared prep)".
const WASTE_RECIPE = {
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
  if (WASTE_RECIPE[key]) return WASTE_RECIPE[key]
  const hit = Object.keys(WASTE_RECIPE).find((k) => key.includes(k))
  return hit ? WASTE_RECIPE[hit] : 'Other / prep'
}

export function getRecipes(locationId) {
  return opsField(locationId, 'recipes').map((r) => ({
    ...r,
    margin: r.price ? ((r.price - r.portionCost) / r.price) * 100 : 0,
    foodCostPct: r.price ? (r.portionCost / r.price) * 100 : 0,
  }))
}

export function getWaste(locationId) {
  return opsField(locationId, 'waste').map((w) => ({ ...w, recipe: wasteRecipeFor(w.item) }))
}

/** Waste cost aggregated by the menu item it's attributed to. */
export function getWasteByRecipe(locationId) {
  const map = new Map()
  for (const w of getWaste(locationId)) {
    const cur = map.get(w.recipe) || { recipe: w.recipe, cost: 0, entries: 0 }
    cur.cost += w.cost
    cur.entries += 1
    map.set(w.recipe, cur)
  }
  return [...map.values()].sort((a, b) => b.cost - a.cost)
}

export function getStaff(locationId) {
  // staff list is single-location only; 'all' returns first branch's team
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  return OPS[id].staff
}

export function getBookings(locationId) {
  return opsField(locationId, 'bookings').sort((a, b) => a.time.localeCompare(b.time))
}

/**
 * P&L statement scaled by period. `day` uses live KPI figures; week/month
 * apply realistic multipliers so the numbers move when the period changes.
 */
export function getPnL(locationId, period = 'day') {
  const k = getKpis(locationId)
  const mult = period === 'month' ? 27.4 : period === 'week' ? 6.4 : 1
  const revenue = k.revenue * mult
  const cogs = k.cogs * mult
  const labour = k.labour * mult
  const overheads = k.overheads * mult
  const grossProfit = revenue - cogs
  const netProfit = grossProfit - labour - overheads
  const p = (v) => (revenue ? (v / revenue) * 100 : 0)
  return {
    period,
    rows: [
      { label: 'Revenue (net of VAT)', amount: revenue, pct: 100, kind: 'revenue' },
      { label: 'Cost of goods sold', amount: -cogs, pct: -p(cogs), kind: 'cost' },
      { label: 'Gross profit', amount: grossProfit, pct: p(grossProfit), kind: 'subtotal' },
      { label: 'Labour cost', amount: -labour, pct: -p(labour), kind: 'cost' },
      { label: 'Overheads (rent, utilities, etc.)', amount: -overheads, pct: -p(overheads), kind: 'cost' },
      { label: 'Net profit', amount: netProfit, pct: p(netProfit), kind: 'total' },
    ],
    totals: { revenue, cogs, labour, overheads, grossProfit, netProfit },
  }
}

/** Labour cost % per day, derived from the 7-day revenue series. */
export function getLabourTrend(locationId) {
  return getRevenueByDay(locationId).map((d) => ({
    day: d.day,
    labourPct: d.revenue ? (d.labour / d.revenue) * 100 : 0,
    foodPct: d.revenue ? (d.cogs / d.revenue) * 100 : 0,
  }))
}

// ---------------------------------------------------------------------------
// ADVISOR DATA — feeds the rule-based Recommendations engine.
//   ingredientTrends  → wholesale price movements (cost/pricing alerts)
//   orderModifiers    → add-on patterns at checkout (menu-engineering gaps)
//   clockIns          → staff punctuality (late clock-ins)
//   holidays          → upcoming staff absence (cover planning)
// Kept separate from OPS so the rules read clean, swap-for-real-AI-later inputs.
// ---------------------------------------------------------------------------

const ADVISOR = {
  bham: {
    ingredientTrends: [
      { name: 'Mozzarella', oldCost: 6.2, newCost: 6.85, unit: 'kg', usedIn: 'Margherita (12")' },
      { name: 'Pepperoni', oldCost: 7.8, newCost: 8.6, unit: 'kg', usedIn: 'Pepperoni (12")' },
    ],
    orderModifiers: [
      { base: 'Margherita (12")', addon: 'extra vegetables', count: 38, suggestion: 'Vegetarian Pizza', suggestedPrice: 10.5 },
      { base: 'Pepperoni (12")', addon: 'extra cheese', count: 26, suggestion: 'Extra-Cheese Pepperoni', suggestedPrice: 12.0 },
    ],
    clockIns: [
      { name: 'Tom Reeves', role: 'Delivery Driver', lateCount: 5, avgLateMins: 12 },
      { name: 'Sofia Alves', role: 'Kitchen Porter', lateCount: 3, avgLateMins: 7 },
    ],
    holidays: [
      { name: 'Marek Kowalski', role: 'Head Pizza Chef', start: '16 Jun', end: '30 Jun', weeks: 2 },
    ],
  },
  leic: {
    ingredientTrends: [
      { name: 'Ham', oldCost: 5.4, newCost: 6.1, unit: 'kg', usedIn: 'Hawaiian (12")' },
      { name: 'Mozzarella', oldCost: 6.2, newCost: 6.85, unit: 'kg', usedIn: 'Margherita (12")' },
    ],
    orderModifiers: [
      { base: 'Margherita (12")', addon: 'added vegetables', count: 31, suggestion: 'Vegetarian Pizza', suggestedPrice: 10.5 },
    ],
    clockIns: [
      { name: 'Jamie Doyle', role: 'Delivery Driver', lateCount: 4, avgLateMins: 9 },
    ],
    holidays: [
      { name: 'Wei Chen', role: 'Pizza Chef', start: '18 Jun', end: '25 Jun', weeks: 1 },
    ],
  },
  cov: {
    ingredientTrends: [
      { name: 'Beef mince', oldCost: 5.0, newCost: 5.7, unit: 'kg', usedIn: 'Meat Feast (12")' },
    ],
    orderModifiers: [
      { base: 'Margherita (12")', addon: 'extra vegetables', count: 22, suggestion: 'Vegetarian Pizza', suggestedPrice: 10.5 },
    ],
    clockIns: [
      { name: 'Chloe Bennett', role: 'Delivery Driver', lateCount: 6, avgLateMins: 14 },
    ],
    holidays: [
      { name: 'Hassan Ali', role: 'Pizza Chef', start: '20 Jun', end: '04 Jul', weeks: 2 },
    ],
  },
}

function advisorField(locationId, field) {
  if (locationId === ALL_LOCATIONS_ID) {
    return LOCATIONS.flatMap((loc) =>
      ADVISOR[loc.id][field].map((row) => ({ ...row, location: loc.name })),
    )
  }
  return ADVISOR[locationId][field].map((row) => ({ ...row, location: locationName(locationId) }))
}

export function getIngredientTrends(locationId) {
  return advisorField(locationId, 'ingredientTrends')
}
export function getOrderModifiers(locationId) {
  return advisorField(locationId, 'orderModifiers')
}
export function getClockIns(locationId) {
  return advisorField(locationId, 'clockIns')
}
export function getHolidays(locationId) {
  return advisorField(locationId, 'holidays')
}

// ===========================================================================
// SUPPLIERS — referenced by inventory lines; power reorder + draft POs.
// ===========================================================================
export const SUPPLIERS = {
  'DoughPro': { name: 'DoughPro', email: 'orders@doughpro.co.uk', phone: '0121 555 0142', leadDays: 2, account: 'NC-DP-118' },
  'Dairy Direct': { name: 'Dairy Direct', email: 'sales@dairydirect.co.uk', phone: '0116 555 0188', leadDays: 1, account: 'NC-DD-204' },
  'Italia Wholesale': { name: 'Italia Wholesale', email: 'trade@italiawholesale.co.uk', phone: '0121 555 0233', leadDays: 3, account: 'NC-IW-061' },
  'Midlands Meats': { name: 'Midlands Meats', email: 'orders@midlandsmeats.co.uk', phone: '0121 555 0410', leadDays: 2, account: 'NC-MM-339' },
  'Fresh Veg Co': { name: 'Fresh Veg Co', email: 'hello@freshvegco.co.uk', phone: '0121 555 0177', leadDays: 1, account: 'NC-FV-512' },
  'Catering Supplies': { name: 'Catering Supplies', email: 'orders@cateringsupplies.co.uk', phone: '0800 555 0199', leadDays: 3, account: 'NC-CS-748' },
  'Pack-It': { name: 'Pack-It', email: 'sales@pack-it.co.uk', phone: '0161 555 0124', leadDays: 4, account: 'NC-PK-090' },
  'Drinks Co': { name: 'Drinks Co', email: 'trade@drinksco.co.uk', phone: '0121 555 0666', leadDays: 2, account: 'NC-DR-301' },
}
export function getSupplier(name) {
  return SUPPLIERS[name] || { name, email: '—', phone: '—', leadDays: 3, account: '—' }
}

// Generic per-location mapper for the top-level (non-OPS) datasets below.
function mapField(MAP, locationId) {
  if (locationId === ALL_LOCATIONS_ID) {
    return LOCATIONS.flatMap((loc) => (MAP[loc.id] || []).map((r) => ({ ...r, location: loc.name })))
  }
  return (MAP[locationId] || []).map((r) => ({ ...r, location: locationName(locationId) }))
}

// ===========================================================================
// PRICE HISTORY + OCR RECEIPTS
// Synthetic baseline price trend per ingredient, plus a runtime log of receipts
// "scanned" via the (simulated) OCR flow. Wire a real OCR engine into
// simulateOcrScan() later — the rest of the contract stays the same.
// ===========================================================================
const PRICE_MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun']
function basePriceHistory(item) {
  const seed = (item.name || '').length
  const startCost = item.cost * (1 - 0.1 - (seed % 4) * 0.012) // ~10–14% lower months ago
  return PRICE_MONTHS.map((m, idx) => {
    const t = idx / (PRICE_MONTHS.length - 1)
    const cost = Math.round((startCost + (item.cost - startCost) * t) * 100) / 100
    return { period: `${m} 2026`, cost, supplier: item.supplier, source: idx === PRICE_MONTHS.length - 1 ? 'Current' : 'Receipt OCR' }
  })
}

// In-memory receipt log (resets on reload — fine for the demo). Newest first.
const RECEIPT_LOG = []
let RECEIPT_SEQ = 90
export function addReceipt(receipt) {
  const id = `RC-${RECEIPT_SEQ++}`
  const record = { id, ...receipt }
  RECEIPT_LOG.unshift(record)
  return record
}
export function getReceipts(locationId) {
  return RECEIPT_LOG.filter((r) => locationId === ALL_LOCATIONS_ID || r.locationId === locationId)
}
export function getPriceHistory(locationId, itemName) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const item = getInventory(id).find((i) => i.name === itemName)
  const base = item ? basePriceHistory(item) : []
  const scanned = RECEIPT_LOG
    .filter((r) => r.locationId === id)
    .flatMap((r) => r.lines.filter((l) => l.name === itemName)
      .map((l) => ({ period: r.dateLabel, cost: l.unitCost, supplier: r.supplier, source: 'Receipt OCR (new)' })))
  return [...base, ...scanned]
}

/**
 * Simulated OCR: returns a "scanned" supplier receipt drawn from the location's
 * real inventory, with unit costs nudged ±6% so the price-comparison view has
 * something to show. Swap this body for a real OCR/vision call later.
 */
export function simulateOcrScan(locationId) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const inv = getInventory(id)
  // Choose the supplier that appears on the most lines for a realistic receipt.
  const counts = inv.reduce((m, i) => ((m[i.supplier] = (m[i.supplier] || 0) + 1), m), {})
  const supplier = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  const items = inv.filter((i) => i.supplier === supplier).slice(0, 6)
  const lines = items.map((it) => {
    const drift = 1 + (((it.name.length % 5) - 2) * 0.03) // ±6%
    const unitCost = Math.round(it.cost * drift * 100) / 100
    const qty = Math.max(1, Math.ceil(it.par - it.inStock) || Math.ceil(it.par * 0.5))
    return {
      name: it.name,
      qty,
      unit: it.unit,
      unitCost,
      oldCost: it.cost,
      lineTotal: Math.round(qty * unitCost * 100) / 100,
      matched: true,
    }
  })
  const total = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100
  return {
    locationId: id,
    supplier,
    reference: `INV-${1000 + (supplier.length * 37) % 9000}`,
    dateLabel: '11 Jun 2026',
    currency: 'GBP',
    lines,
    total,
    engine: 'NeuroChain OCR (simulated)',
  }
}

// ===========================================================================
// CHECKLIST SCHEDULING + COMPLETION HISTORY
// ===========================================================================
export const RECURRENCE_OPTIONS = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly']
export const CHECKLIST_SCHEDULES = [
  { section: 'Opening', recurrence: 'Daily', reminder: '08:00', day: null, assignedRole: 'Manager', active: true },
  { section: 'Closing', recurrence: 'Daily', reminder: '22:30', day: null, assignedRole: 'Manager', active: true },
  { section: 'Cleaning', recurrence: 'Weekly', reminder: '23:00', day: 'Mon', assignedRole: 'Kitchen Porter', active: true },
]
const CHECKLIST_HISTORY = {
  bham: [
    { date: '10 Jun', section: 'Opening', by: 'Daniel Osei', at: '08:12', done: 6, total: 6 },
    { date: '9 Jun', section: 'Closing', by: 'Marek Kowalski', at: '23:41', done: 5, total: 5 },
    { date: '9 Jun', section: 'Opening', by: 'Daniel Osei', at: '08:05', done: 6, total: 6 },
    { date: '8 Jun', section: 'Cleaning', by: 'Sofia Alves', at: '23:18', done: 4, total: 5 },
    { date: '8 Jun', section: 'Closing', by: 'Priya Patel', at: '23:52', done: 5, total: 5 },
  ],
  leic: [
    { date: '10 Jun', section: 'Opening', by: 'Kevin Tran', at: '08:20', done: 6, total: 6 },
    { date: '9 Jun', section: 'Closing', by: 'Wei Chen', at: '23:36', done: 5, total: 5 },
    { date: '8 Jun', section: 'Cleaning', by: 'Lucy Ward', at: '23:05', done: 5, total: 5 },
  ],
  cov: [
    { date: '10 Jun', section: 'Opening', by: 'Rob Skinner', at: '14:02', done: 5, total: 6 },
    { date: '9 Jun', section: 'Closing', by: 'Hassan Ali', at: '00:08', done: 5, total: 5 },
    { date: '8 Jun', section: 'Opening', by: 'Rob Skinner', at: '14:10', done: 6, total: 6 },
  ],
}
export function getChecklistHistory(locationId) {
  return mapField(CHECKLIST_HISTORY, locationId)
}

// ===========================================================================
// BUSINESS EXPENSES (Director) — manual overheads feeding the P&L.
// ===========================================================================
export const EXPENSE_CATEGORIES = [
  'Rent', 'Utilities', 'Insurance', 'Packaging', 'Marketing',
  'Repairs & maintenance', 'Equipment', 'Software & EPOS', 'Cleaning', 'Other',
]
const EXPENSES = {
  bham: [
    { id: 'EXP-101', date: '01 Jun 2026', category: 'Rent', vendor: 'Ladypool Estates', amount: 2400, note: 'Monthly rent' },
    { id: 'EXP-102', date: '03 Jun 2026', category: 'Utilities', vendor: 'British Gas', amount: 540, note: 'Gas & electric' },
    { id: 'EXP-103', date: '05 Jun 2026', category: 'Packaging', vendor: 'Pack-It', amount: 180, note: 'Pizza boxes & bags' },
    { id: 'EXP-104', date: '06 Jun 2026', category: 'Insurance', vendor: 'NFU Mutual', amount: 145, note: 'Premises & liability' },
    { id: 'EXP-105', date: '08 Jun 2026', category: 'Marketing', vendor: 'Meta Ads', amount: 160, note: 'Local boosted posts' },
    { id: 'EXP-106', date: '09 Jun 2026', category: 'Software & EPOS', vendor: 'NeuroChain Ai', amount: 49, note: 'Subscription' },
  ],
  leic: [
    { id: 'EXP-201', date: '01 Jun 2026', category: 'Rent', vendor: 'Belgrave Property', amount: 1950, note: 'Monthly rent' },
    { id: 'EXP-202', date: '04 Jun 2026', category: 'Utilities', vendor: 'EDF Energy', amount: 470, note: 'Gas & electric' },
    { id: 'EXP-203', date: '06 Jun 2026', category: 'Packaging', vendor: 'Pack-It', amount: 150, note: 'Pizza boxes' },
    { id: 'EXP-204', date: '07 Jun 2026', category: 'Repairs & maintenance', vendor: 'OvenFix Ltd', amount: 220, note: 'Oven thermostat' },
    { id: 'EXP-205', date: '09 Jun 2026', category: 'Software & EPOS', vendor: 'NeuroChain Ai', amount: 49, note: 'Subscription' },
  ],
  cov: [
    { id: 'EXP-301', date: '01 Jun 2026', category: 'Rent', vendor: 'Far Gosford Lettings', amount: 1500, note: 'Monthly rent' },
    { id: 'EXP-302', date: '04 Jun 2026', category: 'Utilities', vendor: 'British Gas', amount: 380, note: 'Gas & electric' },
    { id: 'EXP-303', date: '06 Jun 2026', category: 'Cleaning', vendor: 'SpotlessPro', amount: 110, note: 'Weekly deep clean' },
    { id: 'EXP-304', date: '09 Jun 2026', category: 'Software & EPOS', vendor: 'NeuroChain Ai', amount: 49, note: 'Subscription' },
  ],
}
export function getExpenses(locationId) {
  return mapField(EXPENSES, locationId)
}
export function getExpensesByCategory(locationId) {
  const map = new Map()
  for (const e of getExpenses(locationId)) map.set(e.category, (map.get(e.category) || 0) + e.amount)
  return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
}
export function getExpenseTotal(locationId) {
  return getExpenses(locationId).reduce((s, e) => s + e.amount, 0)
}

// ===========================================================================
// STAFF TIME-OFF / HOLIDAY BOOKING (overlays on the rota, week of 8–14 Jun)
// ===========================================================================
export const TIME_OFF_TYPES = ['Holiday', 'Sick', 'Unpaid', 'Training']
const TIME_OFF = {
  bham: [
    { name: 'Sofia Alves', role: 'Kitchen Porter', type: 'Holiday', status: 'Approved', label: '13–14 Jun', weekDays: ['Sat', 'Sun'], days: 2 },
    { name: 'Tom Reeves', role: 'Delivery Driver', type: 'Sick', status: 'Approved', label: '11 Jun', weekDays: ['Wed'], days: 1 },
    { name: 'Marek Kowalski', role: 'Head Pizza Chef', type: 'Holiday', status: 'Pending', label: '16–30 Jun', weekDays: [], days: 14 },
  ],
  leic: [
    { name: 'Mei Lin', role: 'Front of House', type: 'Holiday', status: 'Pending', label: '12–13 Jun', weekDays: ['Fri', 'Sat'], days: 2 },
  ],
  cov: [
    { name: 'Chloe Bennett', role: 'Delivery Driver', type: 'Holiday', status: 'Approved', label: '14 Jun', weekDays: ['Sun'], days: 1 },
  ],
}
// Runtime-bookable time off (added from the Schedule page). Keyed by location id.
const TIME_OFF_RUNTIME = { bham: [], leic: [], cov: [] }
export function bookTimeOff(locationId, entry) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  ;(TIME_OFF_RUNTIME[id] = TIME_OFF_RUNTIME[id] || []).push(entry)
  return entry
}
export function getTimeOff(locationId) {
  const merged = {}
  for (const loc of LOCATIONS) merged[loc.id] = [...(TIME_OFF[loc.id] || []), ...(TIME_OFF_RUNTIME[loc.id] || [])]
  return mapField(merged, locationId)
}

// ===========================================================================
// FLOOR PLAN / TABLE MAP (Bookings)
// Percent-based coordinates on a 100×100 canvas so the map is responsive.
// ===========================================================================
function buildTables() {
  // 8 tables in two rows; coordinates are %s of the floor canvas.
  return [
    { id: 'T1', seats: 2, x: 12, y: 20, w: 14, h: 18, shape: 'round' },
    { id: 'T2', seats: 2, x: 34, y: 20, w: 14, h: 18, shape: 'round' },
    { id: 'T3', seats: 3, x: 56, y: 20, w: 16, h: 18, shape: 'square' },
    { id: 'T4', seats: 6, x: 80, y: 22, w: 16, h: 26, shape: 'rect' },
    { id: 'T5', seats: 4, x: 12, y: 62, w: 16, h: 22, shape: 'square' },
    { id: 'T6', seats: 4, x: 36, y: 62, w: 16, h: 22, shape: 'square' },
    { id: 'T7', seats: 4, x: 60, y: 62, w: 16, h: 22, shape: 'square' },
    { id: 'T8', seats: 4, x: 82, y: 62, w: 16, h: 22, shape: 'square' },
  ]
}
/** Tables for a single location, each merged with tonight's booking (if any). */
export function getTables(locationId) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  const bookings = getBookings(id)
  return buildTables().map((t) => {
    const booking = bookings.find((b) => String(b.table).split('+').includes(t.id))
    const state = booking ? (booking.status === 'Seated' ? 'seated' : booking.status === 'Pending' ? 'pending' : 'reserved') : 'free'
    return { ...t, booking: booking || null, state }
  })
}

// ===========================================================================
// DELIVERY PLATFORM INTEGRATIONS
// ===========================================================================
export const PLATFORMS = [
  { key: 'justeat', name: 'Just Eat', color: '#FF8000', commissionPct: 14 },
  { key: 'ubereats', name: 'Uber Eats', color: '#06C167', commissionPct: 30 },
  { key: 'deliveroo', name: 'Deliveroo', color: '#00CCBC', commissionPct: 25 },
  { key: 'foodhub', name: 'Foodhub', color: '#E11B22', commissionPct: 0 },
]
export const PLATFORM_BY_CHANNEL = {
  'Just Eat': 'justeat', 'Uber Eats': 'ubereats', Deliveroo: 'deliveroo', Foodhub: 'foodhub',
}
const PLATFORM_ACCOUNTS = {
  bham: [
    { platform: 'justeat', accountName: 'Sparkhill Pizza', storeId: 'JE-7741', status: 'Connected', ordersToday: 23, lastSync: '2 min ago' },
    { platform: 'ubereats', accountName: 'Sparkhill Pizza', storeId: 'UE-9920', status: 'Connected', ordersToday: 17, lastSync: '1 min ago' },
    { platform: 'ubereats', accountName: 'Sparkhill — Late Menu', storeId: 'UE-9921', status: 'Action needed', ordersToday: 0, lastSync: '—' },
    { platform: 'deliveroo', accountName: 'Sparkhill Pizza', storeId: 'DL-3380', status: 'Connected', ordersToday: 14, lastSync: '4 min ago' },
    { platform: 'foodhub', accountName: 'Sparkhill Pizza', storeId: 'FH-1102', status: 'Connected', ordersToday: 6, lastSync: '6 min ago' },
  ],
  leic: [
    { platform: 'justeat', accountName: 'Belgrave Pizza', storeId: 'JE-5510', status: 'Connected', ordersToday: 18, lastSync: '3 min ago' },
    { platform: 'ubereats', accountName: 'Belgrave Pizza', storeId: 'UE-7741', status: 'Connected', ordersToday: 12, lastSync: '2 min ago' },
    { platform: 'deliveroo', accountName: 'Belgrave Pizza', storeId: 'DL-2204', status: 'Connected', ordersToday: 9, lastSync: '5 min ago' },
    { platform: 'foodhub', accountName: 'Belgrave Pizza', storeId: 'FH-0907', status: 'Action needed', ordersToday: 0, lastSync: '—' },
  ],
  cov: [
    { platform: 'justeat', accountName: 'City Centre Pizza', storeId: 'JE-9912', status: 'Connected', ordersToday: 15, lastSync: '1 min ago' },
    { platform: 'ubereats', accountName: 'City Centre Pizza', storeId: 'UE-3318', status: 'Connected', ordersToday: 11, lastSync: '3 min ago' },
    { platform: 'deliveroo', accountName: 'City Centre Pizza', storeId: 'DL-7740', status: 'Not connected', ordersToday: 0, lastSync: '—' },
  ],
}
export function getPlatformAccounts(locationId) {
  return mapField(PLATFORM_ACCOUNTS, locationId)
}
/** Today's order split by sales channel (derived from the order feed). */
export function getChannelBreakdown(locationId) {
  const orders = getOrders(locationId)
  const map = new Map()
  for (const o of orders) {
    const cur = map.get(o.channel) || { channel: o.channel, count: 0, revenue: 0 }
    cur.count += 1
    cur.revenue += o.total
    map.set(o.channel, cur)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

// ===========================================================================
// SMS MARKETING + CALL LOG (caller-ID)
// ===========================================================================
const MARKETING = {
  bham: {
    campaigns: [
      { id: 'C-301', name: 'Two-for-Tuesday', date: '04 Jun 2026', audience: 'All opted-in', sent: 1240, delivered: 1212, opened: 631, redeemed: 88, status: 'Completed', message: '🍕 2-for-1 on all 12" pizzas this Tuesday at Sparkhill! Order online & quote TUES241.' },
      { id: 'C-302', name: 'Weekend Family Bundle', date: '30 May 2026', audience: 'Lapsed 30+ days', sent: 540, delivered: 528, opened: 247, redeemed: 41, status: 'Completed', message: 'Miss us? 2 pizzas + sides + drink £24.99 this weekend only. We saved you a slice 🍕' },
      { id: 'C-303', name: 'Rainy Day 15% Off', date: '12 Jun 2026', audience: 'All opted-in', sent: 0, delivered: 0, opened: 0, redeemed: 0, status: 'Scheduled', message: 'Grim out? Stay in 🌧️ 15% off delivery today with code COSY15.' },
    ],
    calls: [
      { time: '19:42', number: '07700 900181', name: 'Hussain', durationSec: 124, outcome: 'Answered', type: 'Order' },
      { time: '19:28', number: '07700 900133', name: 'Begum', durationSec: 0, outcome: 'Missed', type: 'Enquiry' },
      { time: '19:10', number: '07700 900142', name: 'Walsh', durationSec: 86, outcome: 'Answered', type: 'Order' },
      { time: '18:51', number: '07911 123456', name: 'Unknown caller', durationSec: 0, outcome: 'Voicemail', type: 'Enquiry' },
      { time: '18:33', number: '07700 900119', name: 'Patel', durationSec: 142, outcome: 'Answered', type: 'Booking' },
    ],
  },
  leic: {
    campaigns: [
      { id: 'C-401', name: 'Belgrave Loyalty Launch', date: '02 Jun 2026', audience: 'All opted-in', sent: 880, delivered: 861, opened: 402, redeemed: 57, status: 'Completed', message: 'Belgrave reward club is live 🎉 Collect a stamp on every order — your 6th pizza is on us.' },
      { id: 'C-402', name: 'Match Day Meal Deal', date: '08 Jun 2026', audience: 'Delivery customers', sent: 610, delivered: 598, opened: 281, redeemed: 49, status: 'Completed', message: 'Big game tonight ⚽ Pizza + wings + drink £14.99. Order before kick-off!' },
    ],
    calls: [
      { time: '19:55', number: '07700 900244', name: 'Nguyen', durationSec: 98, outcome: 'Answered', type: 'Booking' },
      { time: '19:33', number: '07700 900231', name: 'Smith', durationSec: 0, outcome: 'Missed', type: 'Order' },
      { time: '19:02', number: '07700 900222', name: 'Cheng', durationSec: 110, outcome: 'Answered', type: 'Order' },
    ],
  },
  cov: {
    campaigns: [
      { id: 'C-501', name: 'City Centre Grand Re-open', date: '01 Jun 2026', audience: 'All opted-in', sent: 430, delivered: 421, opened: 198, redeemed: 33, status: 'Completed', message: 'We’re back & better 🍕 20% off your next order this week with WELCOME20.' },
    ],
    calls: [
      { time: '20:40', number: '07700 900388', name: 'Taylor', durationSec: 76, outcome: 'Answered', type: 'Order' },
      { time: '20:12', number: '07700 900377', name: 'Khan', durationSec: 0, outcome: 'Missed', type: 'Booking' },
    ],
  },
}
const SMS_RUNTIME = { bham: [], leic: [], cov: [] }
export function sendSmsCampaign(locationId, campaign) {
  const id = locationId === ALL_LOCATIONS_ID ? LOCATIONS[0].id : locationId
  ;(SMS_RUNTIME[id] = SMS_RUNTIME[id] || []).unshift(campaign)
  return campaign
}
export function getSmsCampaigns(locationId) {
  const merged = {}
  for (const loc of LOCATIONS) merged[loc.id] = [...(SMS_RUNTIME[loc.id] || []), ...((MARKETING[loc.id] || {}).campaigns || [])]
  return mapField(merged, locationId)
}
export function getCallLog(locationId) {
  const merged = {}
  for (const loc of LOCATIONS) merged[loc.id] = (MARKETING[loc.id] || {}).calls || []
  return mapField(merged, locationId)
}

// ===========================================================================
// PRICING PLANS (Billing) — Starter / Pro / Multi-Site + locked features.
// ===========================================================================
export const SETUP_FEE = { min: 100, max: 200 }
export const PLANS = [
  { key: 'starter', name: 'Starter', price: 39, period: 'mo', locations: 'Single location', tagline: 'For one takeaway finding its feet' },
  { key: 'pro', name: 'Pro', price: 69, period: 'mo', locations: 'Single location', tagline: 'Full operations, analytics & forecasting', popular: true },
  { key: 'multisite', name: 'Multi-Site', price: 99, period: 'mo', locations: 'Unlimited locations', tagline: 'Company-wide reporting & control' },
]
export const PLAN_FEATURES = [
  { label: 'EPOS order feed & daily sales', plans: ['starter', 'pro', 'multisite'] },
  { label: 'Opening / closing checklists', plans: ['starter', 'pro', 'multisite'] },
  { label: 'Staff rota & scheduling', plans: ['starter', 'pro', 'multisite'] },
  { label: 'Inventory & low-stock alerts', plans: ['pro', 'multisite'] },
  { label: 'Recipe & margin costing', plans: ['pro', 'multisite'] },
  { label: 'P&L & analytics', plans: ['pro', 'multisite'] },
  { label: 'Demand forecasting', plans: ['pro', 'multisite'] },
  { label: 'SMS marketing & caller-ID', plans: ['pro', 'multisite'] },
  { label: 'Delivery platform integrations', plans: ['pro', 'multisite'] },
  { label: 'Multi-location roll-up reporting', plans: ['multisite'] },
  { label: 'Company expenses & billing control', plans: ['multisite'] },
  { label: 'User permission management', plans: ['multisite'] },
  { label: 'Priority support', plans: ['multisite'] },
]
export const CURRENT_PLAN_KEY = LOCATIONS.length > 1 ? 'multisite' : 'pro'

// ===========================================================================
// FORECASTING INPUTS — 14-day calendar, mock weather + local events.
// The forecasting rule engine (src/lib/forecasting.js) reads these plus the
// existing sales selectors. Anchored the day after TODAY_LABEL (Wed 10 Jun).
// ===========================================================================
export const FORECAST_START_LABEL = 'Thu 11 Jun 2026'
export const FORECAST_CALENDAR = [
  { date: 'Thu 11 Jun', dow: 'Thu' }, { date: 'Fri 12 Jun', dow: 'Fri' },
  { date: 'Sat 13 Jun', dow: 'Sat' }, { date: 'Sun 14 Jun', dow: 'Sun' },
  { date: 'Mon 15 Jun', dow: 'Mon' }, { date: 'Tue 16 Jun', dow: 'Tue' },
  { date: 'Wed 17 Jun', dow: 'Wed' }, { date: 'Thu 18 Jun', dow: 'Thu' },
  { date: 'Fri 19 Jun', dow: 'Fri' }, { date: 'Sat 20 Jun', dow: 'Sat' },
  { date: 'Sun 21 Jun', dow: 'Sun' }, { date: 'Mon 22 Jun', dow: 'Mon' },
  { date: 'Tue 23 Jun', dow: 'Tue' }, { date: 'Wed 24 Jun', dow: 'Wed' },
]
// Aligned by index to FORECAST_CALENDAR. demandFactor multiplies predicted orders.
export const WEATHER_FORECAST = [
  { icon: 'sun', label: 'Sunny', tempC: 23, demandFactor: 1.03, note: 'Warm & dry' },
  { icon: 'cloud', label: 'Cloudy', tempC: 19, demandFactor: 1.0, note: 'Overcast' },
  { icon: 'rain', label: 'Heavy rain', tempC: 15, demandFactor: 1.15, note: 'Rain forecast — delivery orders historically rise ~15%' },
  { icon: 'rain', label: 'Showers', tempC: 16, demandFactor: 1.08, note: 'Scattered showers lift delivery' },
  { icon: 'cloud', label: 'Cloudy', tempC: 18, demandFactor: 1.0, note: 'Overcast' },
  { icon: 'sun', label: 'Sunny', tempC: 22, demandFactor: 1.02, note: 'Pleasant evening' },
  { icon: 'cloud', label: 'Cloudy', tempC: 20, demandFactor: 1.0, note: 'Mild' },
  { icon: 'sun', label: 'Sunny', tempC: 24, demandFactor: 1.03, note: 'Warm & dry' },
  { icon: 'cloud', label: 'Cloudy', tempC: 19, demandFactor: 1.0, note: 'Overcast' },
  { icon: 'rain', label: 'Rain', tempC: 14, demandFactor: 1.12, note: 'Wet evening — strong delivery demand' },
  { icon: 'sun', label: 'Sunny', tempC: 21, demandFactor: 1.02, note: 'Bright spells' },
  { icon: 'cloud', label: 'Cloudy', tempC: 18, demandFactor: 1.0, note: 'Mild' },
  { icon: 'sun', label: 'Sunny', tempC: 23, demandFactor: 1.03, note: 'Warm & dry' },
  { icon: 'cloud', label: 'Cloudy', tempC: 19, demandFactor: 1.0, note: 'Overcast' },
]
// Local events that bump demand, keyed by FORECAST_CALENDAR index.
export const LOCAL_EVENTS = {
  2: { name: 'Local football — Sat fixture', factor: 1.1 },
  3: { name: 'Father’s Day', factor: 1.12 },
  9: { name: 'Payday weekend', factor: 1.06 },
}
