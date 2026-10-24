import { chromium } from '@playwright/test'
const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const u = page.locator('button:has-text("audio")')
if (await u.isVisible().catch(()=>false)) await u.click()
await page.waitForTimeout(400)
await page.keyboard.press('Enter')
await page.waitForTimeout(3500)

const data = await page.evaluate(() => {
  const fn = document.querySelector('[aria-label="Falling notes lane"]')
  const piano = document.querySelector('[aria-label="QWERTY keyboard visualization"]')
  if (!fn || !piano) return null
  const fnRect = fn.getBoundingClientRect()
  const notes = Array.from(fn.querySelectorAll('[class*="note"]'))
  const whites = Array.from(piano.querySelectorAll('[class*="whiteKey"]'))
  const notesInfo = notes.map(n => {
    const r = n.getBoundingClientRect()
    return { xCenter: Math.round(r.x + r.width / 2 - fnRect.x) }
  })
  const keysInfo = whites.map(w => {
    const label = w.querySelector('[class*="label"]')?.textContent ?? '?'
    const r = w.getBoundingClientRect()
    return { label, xCenter: Math.round(r.x + r.width / 2 - fnRect.x) }
  })
  return { notesInfo, keysInfo }
})
console.log(JSON.stringify(data, null, 2))
await page.screenshot({ path: '/tmp/spread.png' })
await browser.close()
