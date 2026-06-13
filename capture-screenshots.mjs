import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://localhost:3000'
const OUT = join(homedir(), 'Desktop', 'PizzaLand-Screenshots')
mkdirSync(OUT, { recursive: true })

const STORAGE_KEY = 'pizzaland.session'
const director = (locationId) => ({ role: 'director', name: 'Anwar', jobTitle: 'Owner', locationId })

// Each shot: file name, session (or null to stay logged out), path, optional
// button text to click, and how long to wait for charts/lazy content.
const SHOTS = [
  { file: '01-sign-in',            session: null,             path: '/login',     wait: 600 },
  { file: '02-dashboard-allsites', session: director('all'),  path: '/dashboard', wait: 2200 },
  { file: '03-dashboard-branch',   session: director('bham'), path: '/dashboard', wait: 2200 },
  { file: '04-pnl-monthly',        session: director('bham'), path: '/pnl',       click: 'This month', wait: 900 },
  { file: '05-analytics',          session: director('bham'), path: '/analytics', wait: 2600 },
  { file: '06-orders',             session: director('all'),  path: '/orders',    wait: 1000 },
  { file: '07-inventory',          session: director('bham'), path: '/inventory', wait: 800 },
  { file: '08-recipes-foodcost',   session: director('bham'), path: '/recipes',   wait: 800 },
  { file: '09-waste',              session: director('bham'), path: '/waste',     wait: 800 },
  { file: '10-staff-wages',        session: director('bham'), path: '/staff',     wait: 800 },
  { file: '11-schedule-rota',      session: director('bham'), path: '/schedule',  wait: 800 },
  { file: '12-bookings',           session: director('bham'), path: '/bookings',  wait: 800 },
  { file: '13-billing',            session: director('all'),  path: '/billing',   wait: 800 },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'],
})

for (const shot of SHOTS) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1024, deviceScaleFactor: 2 })

  // seed (or clear) the session before any app code runs
  await page.evaluateOnNewDocument(
    (key, value) => {
      if (value) localStorage.setItem(key, value)
      else localStorage.removeItem(key)
    },
    STORAGE_KEY,
    shot.session ? JSON.stringify(shot.session) : null,
  )

  try {
    await page.goto(BASE + shot.path, { waitUntil: 'networkidle0', timeout: 30000 })
  } catch {
    await page.goto(BASE + shot.path, { waitUntil: 'domcontentloaded', timeout: 30000 })
  }

  if (shot.click) {
    try {
      await page.evaluate((t) => {
        const el = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t)
        if (el) el.click()
      }, shot.click)
    } catch {}
  }

  await sleep(shot.wait)
  const file = join(OUT, `${shot.file}.png`)
  await page.screenshot({ path: file })
  console.log('✓', shot.file)
  await page.close()
}

await browser.close()
console.log('\nAll screenshots saved to:', OUT)
