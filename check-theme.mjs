import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://localhost:3000'
const LOGIN_EMAIL = process.env.EPOS_LOGIN_EMAIL
const LOGIN_PASSWORD = process.env.EPOS_LOGIN_PASSWORD
const ROUTE = process.argv[2] || '/dashboard'
const OUT = process.argv[3] || '/tmp/theme-check.png'
const CLICK = process.argv[4] || null

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'],
})

const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1.5 })
await page.goto(BASE + '/login', { waitUntil: 'networkidle0', timeout: 30000 })
await page.type('#email', LOGIN_EMAIL)
await page.type('#password', LOGIN_PASSWORD)
await Promise.all([
  page.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 15000 }),
  page.click('button[type="submit"]'),
])

await page.goto(BASE + ROUTE, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {})
if (CLICK) {
  await page.evaluate((t) => {
    const el = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t)
    if (el) el.click()
  }, CLICK)
}
await new Promise((r) => setTimeout(r, 2200))
await page.screenshot({ path: OUT, fullPage: true })
console.log('saved', OUT)
await browser.close()
