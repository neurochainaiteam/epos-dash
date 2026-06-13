// ---------------------------------------------------------------------------
// Rule-based recommendation engine — the "smart business advisor".
//
// Pure functions over the central mock data: no AI call, no backend. Each rule
// inspects the live per-location figures and, when a pattern trips, emits an
// insight card. Swap the selector inputs for a real model later and the page
// doesn't change. The Recommendations page memoises buildRecommendations() per
// location so the rules only re-run when the active branch changes.
//
// Card shape:
//   { id, type: 'opportunity' | 'watch', category, icon,
//     title, insight, data: [{label, value}], action }
//   type is used only for the summary counts; every card renders the same
//   visual scheme (cyan icon, violet title, soft-silver body).
// ---------------------------------------------------------------------------

const round = (n) => Math.round(n)
const money = (n) => `£${(Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 0 })}`
const money2 = (n) => `£${(Math.round(n * 100) / 100).toFixed(2)}`

// Targets the rules judge against (typical UK takeaway benchmarks).
const TARGET = { foodCostPct: 32, labourPct: 25, netMarginPct: 20 }

// Loosely link an inventory line to a best-selling dish by shared keyword.
function linkedDish(itemName, bestSellers) {
  const words = itemName.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3)
  return bestSellers.find((s) => words.some((w) => s.name.toLowerCase().includes(w)))
}

// Accept pre-fetched data instead of calling mockData directly.
// data: { snap, bestSellers, recipes, inventory, byDay, labourTrend, waste,
//         ingredientTrends, orderModifiers, clockIns, holidays }
export function buildRecommendations(data) {
  const snap            = data.snap            || {}
  const bestSellers     = data.bestSellers     || []
  const recipes         = data.recipes         || []
  const inventory       = data.inventory       || []
  const byDay           = data.byDay           || []
  const labourTrend     = data.labourTrend     || []
  const waste           = data.waste           || []
  const ingredientTrends= data.ingredientTrends|| []
  const orderModifiers  = data.orderModifiers  || []
  const clockIns        = data.clockIns        || []
  const holidays        = data.holidays        || []

  const rev = snap.revenue || 1
  const kpis = {
    avgOrderValue: snap.avgOrderValue || 0,
    orderCount:    snap.order_count   || 0,
    netProfit:     snap.netProfit     || 0,
    revenue:       snap.revenue       || 0,
  }
  const metrics = {
    labourPct:    snap.revenue ? (snap.labour   / rev) * 100 : 0,
    foodCostPct:  snap.revenue ? (snap.cogs     / rev) * 100 : 0,
    netMarginPct: snap.revenue ? (snap.netProfit/ rev) * 100 : 0,
  }

  const recipeByDish = new Map(recipes.map((r) => [r.dish, r]))
  const sellerNames = new Set(bestSellers.map((s) => s.name))
  const cards = []

  // -- 1. Cost / pricing alerts — wholesale price rising -----------------------
  ingredientTrends
    .filter((t) => t.newCost > t.oldCost)
    .forEach((t) => {
      const trendPct = round(((t.newCost - t.oldCost) / t.oldCost) * 100)
      const dish = recipeByDish.get(t.usedIn)
      cards.push({
        id: `cost-${t.name}-${t.location || ''}`,
        type: 'watch',
        category: 'Cost alert',
        icon: 'TrendingUp',
        title: `${t.name} wholesale price is rising`,
        insight: `${t.name} is up ${trendPct}% (${money2(t.oldCost)} → ${money2(t.newCost)}/${t.unit}). It's a core ingredient in ${t.usedIn}, so restructure the recipe or nudge its price to protect your margin${dish ? ` (currently ${round(dish.margin)}%)` : ''}.`,
        data: [
          { label: 'Old cost', value: `${money2(t.oldCost)}/${t.unit}` },
          { label: 'New cost', value: `${money2(t.newCost)}/${t.unit}` },
          { label: 'Change', value: `+${trendPct}%` },
        ],
        action: dish
          ? `Raise ${t.usedIn} by ~£0.50 or trim portion size to hold the ${round(dish.margin)}% margin.`
          : `Review pricing on dishes that use ${t.name}.`,
      })
    })

  // -- 2. Menu engineering / upsell gaps — frequent manual add-ons -------------
  orderModifiers.forEach((m) => {
    cards.push({
      id: `modifier-${m.base}-${m.addon}-${m.location || ''}`,
      type: 'opportunity',
      category: 'Menu idea',
      icon: 'Utensils',
      title: `Turn a popular add-on into its own item`,
      insight: `Customers ordered ${m.base} and added "${m.addon}" ${m.count} times this period. Adding a "${m.suggestion}" as its own menu item captures that demand and speeds up the kitchen.`,
      data: [
        { label: 'Base item', value: m.base.replace(' (12")', '') },
        { label: 'Manual add-ons', value: `${m.count}×` },
        { label: 'Suggested price', value: money2(m.suggestedPrice) },
      ],
      action: `Add "${m.suggestion}" to the menu at ${money2(m.suggestedPrice)}.`,
    })
  })

  // -- 3. Reorder alerts for fast-selling items --------------------------------
  inventory
    .map((i) => ({ ...i, ratio: i.par ? i.inStock / i.par : 1 }))
    .filter((i) => i.ratio < 0.45)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 2)
    .forEach((item) => {
      const dish = linkedDish(item.name, bestSellers)
      const orderQty = Math.max(1, Math.ceil(item.par - item.inStock))
      cards.push({
        id: `reorder-${item.name}-${item.location || ''}`,
        type: 'watch',
        category: 'Reorder',
        icon: 'PackageX',
        title: `Reorder ${item.name.toLowerCase()} soon`,
        insight: dish
          ? `${item.name} is down to ${round(item.ratio * 100)}% of par and feeds ${dish.name}, which sold ${dish.qty} yesterday. At this rate you'll run short mid-service.`
          : `${item.name} is down to ${round(item.ratio * 100)}% of par (${item.inStock} ${item.unit} left), little buffer before service.`,
        data: [
          { label: 'In stock', value: `${item.inStock} ${item.unit}` },
          { label: 'Par level', value: `${item.par} ${item.unit}` },
          { label: 'Supplier', value: item.supplier },
        ],
        action: `Raise a PO to ${item.supplier} for ~${orderQty} ${item.unit}.`,
      })
    })

  // -- 4. Underperformer / remove suggestion -----------------------------------
  const underperformer = recipes.find((r) => !sellerNames.has(r.dish))
  if (underperformer) {
    cards.push({
      id: `underperformer-${underperformer.dish}-${underperformer.location || ''}`,
      type: 'watch',
      category: 'Menu',
      icon: 'TrendingDown',
      title: `${underperformer.dish} isn't pulling its weight`,
      insight: `${underperformer.dish} didn't make this week's top sellers despite a ${round(underperformer.margin)}% margin. Slow movers still tie up prep, fridge space and drive waste.`,
      data: [
        { label: 'Menu price', value: money2(underperformer.price) },
        { label: 'Margin', value: `${round(underperformer.margin)}%` },
        { label: 'Status', value: 'Outside top 5' },
      ],
      action: `Run a 2-week feature promo, and if it still lags, drop it to cut inventory and waste.`,
    })
  }

  // -- 5. Staff punctuality ----------------------------------------------------
  clockIns
    .filter((c) => c.lateCount >= 3)
    .sort((a, b) => b.lateCount - a.lateCount)
    .slice(0, 2)
    .forEach((c) => {
      cards.push({
        id: `punctuality-${c.name}-${c.location || ''}`,
        type: 'watch',
        category: 'Team',
        icon: 'Clock',
        title: `${c.name} has been clocking in late`,
        insight: `${c.name} (${c.role}) has clocked in late ${c.lateCount} times this period, averaging ${c.avgLateMins} minutes. Worth a quick, friendly follow-up before it affects service.`,
        data: [
          { label: 'Late shifts', value: `${c.lateCount}` },
          { label: 'Avg late by', value: `${c.avgLateMins} min` },
          { label: 'Role', value: c.role },
        ],
        action: `Have a quick word with ${c.name.split(' ')[0]} and confirm shift start times.`,
      })
    })

  // -- 6. Staff availability — upcoming holiday --------------------------------
  holidays.forEach((h) => {
    cards.push({
      id: `holiday-${h.name}-${h.location || ''}`,
      type: 'watch',
      category: 'Cover',
      icon: 'CalendarOff',
      title: `${h.name} is on holiday soon`,
      insight: `${h.name} (${h.role}) is away for ${h.weeks} week${h.weeks === 1 ? '' : 's'} from ${h.start} to ${h.end}. Plan cover for their shifts now to avoid being short on the line.`,
      data: [
        { label: 'Who', value: h.role },
        { label: 'Dates', value: `${h.start}–${h.end}` },
        { label: 'Length', value: `${h.weeks} wk` },
      ],
      action: `Arrange cover for ${h.start}–${h.end}, prioritising peak Fri/Sat shifts.`,
    })
  })

  // -- 7. High-labour-day flag -------------------------------------------------
  const peakDay = [...byDay].sort((a, b) => b.revenue - a.revenue)[0]
  const heavyDay = [...labourTrend].sort((a, b) => b.labourPct - a.labourPct)[0]
  if (heavyDay && heavyDay.labourPct > TARGET.labourPct + 3) {
    cards.push({
      id: `labour-${heavyDay.day}`,
      type: 'watch',
      category: 'Labour',
      icon: 'Users2',
      title: `${heavyDay.day} labour is running hot`,
      insight: `Labour hit ${round(heavyDay.labourPct)}% of revenue on ${heavyDay.day}, well over the ${TARGET.labourPct}% target. Over-staffing a quieter day quietly eats your margin.`,
      data: [
        { label: 'Labour %', value: `${round(heavyDay.labourPct)}%` },
        { label: 'Target', value: `≤ ${TARGET.labourPct}%` },
        { label: 'Busiest day', value: peakDay ? peakDay.day : 'N/A' },
      ],
      action: peakDay && peakDay.day !== heavyDay.day
        ? `Trim a shift on ${heavyDay.day} and protect cover for ${peakDay.day}.`
        : `Trim one shift on ${heavyDay.day}.`,
    })
  }

  // -- 8. Margin insight — high-margin dish selling poorly (promote) -----------
  const hiddenGem = recipes
    .filter((r) => !sellerNames.has(r.dish) && r.margin >= 65)
    .sort((a, b) => b.margin - a.margin)[0]
  if (hiddenGem) {
    cards.push({
      id: `promote-${hiddenGem.dish}-${hiddenGem.location || ''}`,
      type: 'opportunity',
      category: 'Margin',
      icon: 'TrendingUp',
      title: `Promote ${hiddenGem.dish}, high margin and low sales`,
      insight: `${hiddenGem.dish} earns a ${round(hiddenGem.margin)}% margin but isn't in your top sellers. A feature slot or a bundle would turn that margin into real profit.`,
      data: [
        { label: 'Margin', value: `${round(hiddenGem.margin)}%` },
        { label: 'Price', value: money2(hiddenGem.price) },
        { label: 'Sales', value: 'Below top 5' },
      ],
      action: `Feature ${hiddenGem.dish} on the homepage or pair it in a meal deal.`,
    })
  }

  // -- 9. Margin insight — low-margin best-seller (review pricing) -------------
  const cheapHero = bestSellers
    .map((s) => ({ ...s, recipe: recipeByDish.get(s.name) }))
    .filter((s) => s.recipe && s.recipe.margin < 62)
    .sort((a, b) => a.recipe.margin - b.recipe.margin)[0]
  if (cheapHero) {
    cards.push({
      id: `reprice-${cheapHero.name}-${cheapHero.location || ''}`,
      type: 'opportunity',
      category: 'Pricing',
      icon: 'Percent',
      title: `${cheapHero.name} sells well but earns little`,
      insight: `${cheapHero.name} shifts ${cheapHero.qty}/day yet only returns a ${round(cheapHero.recipe.margin)}% margin. A modest price rise barely dents demand on a favourite and lifts profit across every order.`,
      data: [
        { label: 'Sold', value: `${cheapHero.qty}/day` },
        { label: 'Margin', value: `${round(cheapHero.recipe.margin)}%` },
        { label: 'Price', value: money2(cheapHero.recipe.price) },
      ],
      action: `Test a £0.50 rise on ${cheapHero.name} and watch volume hold.`,
    })
  }

  // -- 10. Margin hero to push (opportunity) -----------------------------------
  const hero = bestSellers
    .map((s) => ({ ...s, recipe: recipeByDish.get(s.name) }))
    .filter((s) => s.recipe)
    .sort((a, b) => b.recipe.margin - a.recipe.margin)[0]
  if (hero && (!cheapHero || hero.name !== cheapHero.name)) {
    cards.push({
      id: `push-${hero.name}-${hero.location || ''}`,
      type: 'opportunity',
      category: 'Margin',
      icon: 'Sparkles',
      title: `Push ${hero.name}, your margin hero`,
      insight: `${hero.name} already sells ${hero.qty}/day and carries a ${round(hero.recipe.margin)}% margin. Featuring it lifts profit faster than discounting ever will.`,
      data: [
        { label: 'Sold', value: `${hero.qty}/day` },
        { label: 'Margin', value: `${round(hero.recipe.margin)}%` },
        { label: 'Revenue', value: money(hero.revenue) },
      ],
      action: `Pin it to the top of the online menu and bundle it with a drink.`,
    })
  }

  // -- 11. Waste warning -------------------------------------------------------
  const wasteTotal = waste.reduce((s, w) => s + (w.cost || 0), 0)
  if (wasteTotal > 12) {
    const reasonTotals = waste.reduce((m, w) => {
      m[w.reason] = (m[w.reason] || 0) + w.cost
      return m
    }, {})
    const topReason = Object.entries(reasonTotals).sort((a, b) => b[1] - a[1])[0]
    cards.push({
      id: 'waste-total',
      type: 'watch',
      category: 'Waste',
      icon: 'Trash2',
      title: 'Waste is adding up',
      insight: `${money(wasteTotal)} of stock was logged as waste in the last few days, mostly "${topReason[0].toLowerCase()}". That's pure margin straight in the bin.`,
      data: [
        { label: 'Logged waste', value: money(wasteTotal) },
        { label: 'Top cause', value: topReason[0] },
        { label: 'Lines', value: `${waste.length}` },
      ],
      action: `Tighten prep forecasting and review portioning to cut "${topReason[0].toLowerCase()}".`,
    })
  }

  // -- 11b. Waste concentrated on one menu item --------------------------------
  const wasteByRecipeMap = new Map()
  waste.forEach((w) => { const cur = wasteByRecipeMap.get(w.recipe) || { recipe: w.recipe, cost: 0, entries: 0 }; cur.cost += w.cost; cur.entries += 1; wasteByRecipeMap.set(w.recipe, cur) })
  const wasteByRecipe = [...wasteByRecipeMap.values()].sort((a, b) => b.cost - a.cost)
  const topWasteItem = wasteByRecipe.find((w) => !w.recipe.includes('shared') && !w.recipe.includes('Other'))
    || wasteByRecipe[0]
  if (topWasteItem && topWasteItem.cost >= 3 && wasteTotal > 0) {
    const share = round((topWasteItem.cost / wasteTotal) * 100)
    cards.push({
      id: `waste-recipe-${topWasteItem.recipe}`,
      type: 'watch',
      category: 'Waste',
      icon: 'Trash2',
      title: `${topWasteItem.recipe} drives the most waste`,
      insight: `${topWasteItem.recipe} accounts for ${money2(topWasteItem.cost)} (${share}%) of logged waste across ${topWasteItem.entries} entr${topWasteItem.entries === 1 ? 'y' : 'ies'}. Attributing waste per item makes the costly lines obvious.`,
      data: [
        { label: 'Waste cost', value: money2(topWasteItem.cost) },
        { label: 'Share', value: `${share}%` },
        { label: 'Entries', value: `${topWasteItem.entries}` },
      ],
      action: `Review prep volumes and portioning for ${topWasteItem.recipe} to cut this back.`,
    })
  }

  // -- 12. Lift average order value (opportunity) ------------------------------
  if (kpis.avgOrderValue && bestSellers[0]) {
    cards.push({
      id: 'aov-bundle',
      type: 'opportunity',
      category: 'Sales',
      icon: 'ShoppingBag',
      title: 'Lift average order value',
      insight: `Average order is ${money2(kpis.avgOrderValue)} across ${kpis.orderCount} orders. ${bestSellers[0].name} pairs naturally with a side and drink, so a checkout nudge can add £1–2 per order.`,
      data: [
        { label: 'Avg order', value: money2(kpis.avgOrderValue) },
        { label: 'Orders', value: `${kpis.orderCount}` },
        { label: 'Anchor', value: bestSellers[0].name },
      ],
      action: `Add a "${bestSellers[0].name} + side + drink" meal deal at checkout.`,
    })
  }

  // -- 13. Net margin health ---------------------------------------------------
  if (metrics.netMarginPct < TARGET.netMarginPct) {
    cards.push({
      id: 'net-margin',
      type: 'watch',
      category: 'P&L',
      icon: 'TrendingDown',
      title: 'Net margin below target',
      insight: `Net profit margin is ${round(metrics.netMarginPct)}% against a ${TARGET.netMarginPct}% target. Labour (${round(metrics.labourPct)}%) and food cost (${round(metrics.foodCostPct)}%) are the levers most worth pulling.`,
      data: [
        { label: 'Net margin', value: `${round(metrics.netMarginPct)}%` },
        { label: 'Labour %', value: `${round(metrics.labourPct)}%` },
        { label: 'Food %', value: `${round(metrics.foodCostPct)}%` },
      ],
      action: `Action the reorder, labour and margin cards to close the gap.`,
    })
  } else {
    cards.push({
      id: 'net-margin-healthy',
      type: 'opportunity',
      category: 'P&L',
      icon: 'TrendingUp',
      title: 'Healthy margin, room to reinvest',
      insight: `Net margin is ${round(metrics.netMarginPct)}%, ahead of the ${TARGET.netMarginPct}% target. A good moment to reinvest in marketing or a new menu line while the base is strong.`,
      data: [
        { label: 'Net margin', value: `${round(metrics.netMarginPct)}%` },
        { label: 'Net profit', value: money(kpis.netProfit) },
        { label: 'Target', value: `${TARGET.netMarginPct}%` },
      ],
      action: `Funnel a slice of profit into a local campaign to grow order volume.`,
    })
  }

  // Opportunities first (the upside), watch items after.
  const order = { opportunity: 0, watch: 1 }
  return cards.sort((a, b) => order[a.type] - order[b.type])
}
