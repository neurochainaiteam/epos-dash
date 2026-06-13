import puppeteer from 'puppeteer-core'
import { mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://localhost:3000'
const SHOTS = '/tmp/nc-shots2'
const DL = '/tmp/nc-exports'
mkdirSync(SHOTS, { recursive: true })
if (existsSync(DL)) rmSync(DL, { recursive: true, force: true })
mkdirSync(DL, { recursive: true })

const KEY = 'neurochain.session'
const director = JSON.stringify({ role: 'director', name: 'Anwar', jobTitle: 'Owner', locationId: 'bham' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'],
})

// 1. Landing redirect for director (should go to /recommendations)
const p0 = await browser.newPage()
await p0.evaluateOnNewDocument((k, v) => localStorage.setItem(k, v), KEY, director)
await p0.goto(BASE + '/', { waitUntil: 'networkidle0' })
await sleep(1200)
console.log('director landing URL:', p0.url())
await p0.close()

// 2. Recommendations screenshot
const p1 = await browser.newPage()
await p1.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 1.4 })
await p1.evaluateOnNewDocument((k, v) => localStorage.setItem(k, v), KEY, director)
const errs = []
p1.on('pageerror', (e) => errs.push(String(e)))
await p1.goto(BASE + '/recommendations', { waitUntil: 'networkidle0' })
await sleep(1600)
const cardCount = await p1.evaluate(() => document.querySelectorAll('h3.rec-title').length)
console.log('recommendation cards:', cardCount)
await p1.screenshot({ path: `${SHOTS}/recommendations.png`, fullPage: true })
await p1.close()

// 3. Analytics — screenshot + exercise export (PDF then PNG)
const p2 = await browser.newPage()
await p2.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1.4 })
await p2.evaluateOnNewDocument((k, v) => localStorage.setItem(k, v), KEY, director)
p2.on('pageerror', (e) => errs.push(String(e)))
p2.on('console', (m) => { if (m.type() === 'error' || /export/i.test(m.text())) console.log('  console:', m.text()) })
p2.on('dialog', async (d) => { console.log('  DIALOG:', d.message()); await d.dismiss() })
const client = await p2.target().createCDPSession()
await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL })
await p2.goto(BASE + '/analytics', { waitUntil: 'networkidle0' })
await sleep(2800)
await p2.screenshot({ path: `${SHOTS}/analytics.png` })

async function clickExport(formatLabel) {
  await p2.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /Export/i.test(b.textContent))
    btn?.click()
  })
  await sleep(500)
  await p2.evaluate((label) => {
    const item = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === label)
    item?.click()
  }, formatLabel)
}

await clickExport('PDF document')
await sleep(4000)
await clickExport('PNG image')
await sleep(4000)

const files = readdirSync(DL)
console.log('exported files:', files)
console.log('page errors:', errs.length ? errs : 'none')
await p2.close()
await browser.close()
console.log('done')
