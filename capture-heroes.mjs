import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://localhost:3000'
const OUT = join(homedir(), 'Desktop', 'PizzaLand-Screenshots', 'heroes')
mkdirSync(OUT, { recursive: true })

const STORAGE_KEY = 'pizzaland.session'
const director = (locationId) => ({ role: 'director', name: 'Anwar', jobTitle: 'Owner', locationId })
const PAD = 16

// target is either { selector } (use element directly) or { text, card } (find
// the tightest element containing the text, optionally climb to its card)
const HEROES = [
  { file: 'kpi-strip',         path: '/dashboard', wait: 2200, target: { selector: '[class*="lg:grid-cols-5"]' } },
  { file: 'key-margins',       path: '/dashboard', wait: 2200, target: { text: 'Key margins', card: true } },
  { file: 'revenue-chart',     path: '/dashboard', wait: 2200, target: { text: 'Revenue through the day', card: true } },
  { file: 'best-sellers',      path: '/dashboard', wait: 2200, target: { text: 'Best sellers today', card: true } },
  { file: 'pnl-statement',     path: '/pnl', click: 'This month', wait: 900, target: { text: 'P&L statement', card: true } },
  { file: 'pnl-margin-cards',  path: '/pnl', click: 'This month', wait: 900, target: { selector: '[class*="sm:grid-cols-3"]' } },
  { file: 'recipe-foodcost',   path: '/recipes', wait: 900, target: { text: 'Margherita (12")', card: true } },
  { file: 'analytics-labour',  path: '/analytics', wait: 2600, target: { text: 'Labour & food cost % of revenue', card: true } },
  { file: 'low-stock-alert',   path: '/inventory', wait: 900, target: { text: 'below 40% of par', card: true } },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'],
})

for (const hero of HEROES) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 })
  await page.evaluateOnNewDocument(
    (key, value) => localStorage.setItem(key, value),
    STORAGE_KEY,
    JSON.stringify(director('bham')),
  )

  try {
    await page.goto(BASE + hero.path, { waitUntil: 'networkidle0', timeout: 30000 })
  } catch {
    await page.goto(BASE + hero.path, { waitUntil: 'domcontentloaded', timeout: 30000 })
  }

  if (hero.click) {
    try {
      await page.evaluate((t) => {
        const el = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t)
        if (el) el.click()
      }, hero.click)
    } catch {}
  }

  await sleep(hero.wait)

  const rect = await page.evaluate((target) => {
    let el = null
    if (target.selector) {
      el = document.querySelector(target.selector)
    } else if (target.text) {
      const all = [...document.querySelectorAll('body *')]
      const matches = all.filter((e) => e.textContent && e.textContent.includes(target.text))
      // tightest = the deepest element still containing the text
      el = matches.find((e) => ![...e.children].some((c) => c.textContent && c.textContent.includes(target.text)))
        || matches[matches.length - 1]
      if (el && target.card) el = el.closest('[class*="rounded-lg"]') || el
    }
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  }, hero.target)

  if (!rect || rect.width < 4 || rect.height < 4) {
    console.log('✗', hero.file, '(target not found)')
    await page.close()
    continue
  }

  const clip = {
    x: Math.max(0, rect.x - PAD),
    y: Math.max(0, rect.y - PAD),
    width: Math.round(rect.width + PAD * 2),
    height: Math.round(rect.height + PAD * 2),
  }
  await page.screenshot({ path: join(OUT, `${hero.file}.png`), clip, captureBeyondViewport: true })
  console.log('✓', hero.file)
  await page.close()
}

await browser.close()
console.log('\nHero crops saved to:', OUT)
