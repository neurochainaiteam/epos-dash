// ---------------------------------------------------------------------------
// Demand forecasting — rule-based predictions over the central mock data.
//
// No ML model and no backend: this projects the existing day-of-week sales
// pattern forward across the 14-day FORECAST_CALENDAR, then layers mock weather
// and local-event factors on top. The output shape (daily forecast, prep
// callouts, inventory run-out, staffing, weather) is exactly what a real
// forecasting service would return — swap the body, keep the contract.
// ---------------------------------------------------------------------------

import { FORECAST_CALENDAR, WEATHER_FORECAST, LOCAL_EVENTS } from '@/data/mockData'

const round = (n) => Math.round(n)
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// Staffing model: roughly one team member per ~28 orders, 2–7 on the floor.
const ORDERS_PER_STAFF = 28
const SHIFT_HOURS = 7
const LABOUR_TARGET = 25

// Accept pre-fetched data instead of calling mockData directly.
// data: { snap, byDay, inventory, staff, supplierMap }
// supplierMap: { [supplierName]: { leadDays, ... } }
export function buildForecast(data) {
  const snap      = data.snap      || {}
  const byDayArr  = data.byDay     || []
  const inventory = data.inventory || []
  const staff     = data.staff     || []
  const supplierMap = data.supplierMap || {}

  const kpis = { avgOrderValue: snap.avgOrderValue || 11, orderCount: snap.order_count || 1 }

  const aov = kpis.avgOrderValue || 11
  const byDay = new Map(byDayArr.map((d) => [d.day, d]))
  const avgRevenue = byDayArr.reduce((s, d) => s + d.revenue, 0) / byDayArr.length
  const avgWage = staff.length ? staff.reduce((s, p) => s + p.wage, 0) / staff.length : 12
  const costPerStaff = avgWage * SHIFT_HOURS

  // ---- 1. Daily forecast across the 14-day calendar -----------------------
  const daily = FORECAST_CALENDAR.map((cal, i) => {
    const base = byDay.get(cal.dow) || { revenue: avgRevenue, labour: avgRevenue * 0.25, cogs: avgRevenue * 0.3 }
    const weather = WEATHER_FORECAST[i] || { demandFactor: 1, label: 'Cloudy', note: '', icon: 'cloud', tempC: 19 }
    const event = LOCAL_EVENTS[i] || null
    const growth = 1 + 0.01 * Math.floor(i / 7) // gentle week-over-week lift
    const factor = weather.demandFactor * (event ? event.factor : 1) * growth

    const predictedRevenue = round(base.revenue * factor)
    const predictedOrders = round(predictedRevenue / aov)
    const deltaPct = round((predictedRevenue / avgRevenue - 1) * 100)
    const level = deltaPct >= 12 ? 'busy' : deltaPct <= -12 ? 'quiet' : 'normal'

    const recommendedStaff = clamp(Math.ceil(predictedOrders / ORDERS_PER_STAFF), 2, 7)
    const labourCost = recommendedStaff * costPerStaff
    const labourPct = round((labourCost / predictedRevenue) * 100)

    return {
      i,
      date: cal.date,
      dow: cal.dow,
      weekend: cal.dow === 'Sat' || cal.dow === 'Sun',
      predictedRevenue,
      predictedOrders,
      low: round(predictedRevenue * 0.9),
      high: round(predictedRevenue * 1.12),
      deltaPct,
      level,
      weather,
      event,
      recommendedStaff,
      labourPct,
    }
  })

  const next7 = daily.slice(0, 7)

  // ---- 2. Prep callouts (actionable, plain-English) -----------------------
  const callouts = []
  const busiest = [...next7].sort((a, b) => b.predictedOrders - a.predictedOrders)[0]
  const quietest = [...next7].sort((a, b) => a.predictedOrders - b.predictedOrders)[0]

  if (busiest && busiest.deltaPct > 6) {
    const extraOrders = round(busiest.predictedOrders - avgRevenue / aov)
    const extraDough = Math.max(10, round(extraOrders * 0.8))
    callouts.push({
      id: 'busy',
      type: 'busy',
      icon: 'TrendingUp',
      title: `${busiest.dow} ${busiest.date.split(' ').slice(1).join(' ')}: ~+${busiest.deltaPct}% orders expected`,
      detail: `Prep an extra ~${extraDough} dough balls and add a team member — ${busiest.recommendedStaff} on the floor keeps service fast and labour near ${LABOUR_TARGET}%.`,
    })
  }
  if (quietest && quietest.deltaPct < -6) {
    callouts.push({
      id: 'quiet',
      type: 'quiet',
      icon: 'TrendingDown',
      title: `${quietest.dow} ${quietest.date.split(' ').slice(1).join(' ')} is quiet (~${quietest.deltaPct}%)`,
      detail: `Trim one shift and scale back the stock order — ${quietest.recommendedStaff} staff is plenty and protects your margin on a slow day.`,
    })
  }
  const rainDay = next7.find((d) => d.weather.icon === 'rain' && d.weather.demandFactor >= 1.08)
  if (rainDay) {
    callouts.push({
      id: 'weather',
      type: 'weather',
      icon: 'CloudRain',
      title: `${rainDay.dow} ${rainDay.date.split(' ').slice(1).join(' ')}: ${rainDay.weather.label.toLowerCase()} forecast`,
      detail: `Delivery orders historically rise ~${round((rainDay.weather.demandFactor - 1) * 100)}% in the wet — roster an extra driver and pre-pack popular bundles.`,
    })
  }
  const eventDay = next7.find((d) => d.event)
  if (eventDay) {
    callouts.push({
      id: 'event',
      type: 'event',
      icon: 'CalendarHeart',
      title: `${eventDay.event.name}`,
      detail: `Expect ~+${round((eventDay.event.factor - 1) * 100)}% on ${eventDay.dow} — feature a sharing bundle and make sure dough, cheese and boxes are well stocked.`,
    })
  }

  // ---- 3. Inventory forecast — predicted run-out per ingredient -----------
  const demandScale = next7.reduce((s, d) => s + d.predictedOrders, 0) / 7 / (kpis.orderCount || 1)
  const inventoryForecast = inventory
    .map((item) => {
      const dailyUsage = Math.max(0.5, round(item.par * 0.22 * demandScale * 10) / 10)
      const daysLeft = Math.max(0, Math.floor(item.inStock / dailyUsage))
      const runOut = daysLeft >= FORECAST_CALENDAR.length
        ? null
        : FORECAST_CALENDAR[clamp(daysLeft, 0, FORECAST_CALENDAR.length - 1)]
      const supplier = supplierMap[item.supplier] || { leadDays: 3 }
      const suggestedQty = Math.max(0, Math.ceil(item.par - item.inStock + dailyUsage * supplier.leadDays))
      return {
        name: item.name,
        unit: item.unit,
        inStock: item.inStock,
        dailyUsage,
        daysLeft,
        runOutDate: runOut ? runOut.date : null,
        suggestedQty,
        supplier: item.supplier,
        leadDays: supplier.leadDays,
      }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)

  // ---- 4. Staffing suggestions (next 7 days) ------------------------------
  const staffing = next7.map((d) => ({
    date: d.date,
    dow: d.dow,
    predictedOrders: d.predictedOrders,
    recommendedStaff: d.recommendedStaff,
    labourPct: d.labourPct,
    status: d.labourPct > LABOUR_TARGET + 4 ? 'high' : 'ok',
  }))

  // ---- 5. Headline summary ------------------------------------------------
  const next7Revenue = next7.reduce((s, d) => s + d.predictedRevenue, 0)
  const next7Orders = next7.reduce((s, d) => s + d.predictedOrders, 0)
  const avgLabourPct = round(next7.reduce((s, d) => s + d.labourPct, 0) / next7.length)

  return {
    daily,
    next7,
    callouts,
    inventoryForecast,
    staffing,
    weather: daily.map((d) => ({ date: d.date, dow: d.dow, ...d.weather })),
    summary: {
      next7Revenue,
      next7Orders,
      busiest,
      quietest,
      avgLabourPct,
      labourTarget: LABOUR_TARGET,
      confidence: 86, // mock model confidence for the "predictive" framing
    },
  }
}
