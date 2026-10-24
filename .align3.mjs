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

const samples = []
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(800)
  const info = await page.evaluate(() => {
    const fn = document.querySelector('[aria-label="Falling notes lane"]')
    const fnRect = fn?.getBoundingClientRect()
    const notes = Array.from(fn?.querySelectorAll('[class*="note"]') ?? [])
    return notes.map(n => {
      const r = n.getBoundingClientRect()
      const style = n.getAttribute('style') ?? ''
      const x = Math.round(r.x + r.width / 2 - fnRect.x)
      const y = Math.round(r.y - fnRect.y)
      const bg = style.match(/var\(--note-([a-g])\)/)?.[1] ?? '?'
      return { x, y, bg }
    })
  })
  samples.push({ i, count: info.length, notes: info })
}
console.log(JSON.stringify(samples, null, 2))
await page.screenshot({ path: '/tmp/final.png' })
await browser.close()
