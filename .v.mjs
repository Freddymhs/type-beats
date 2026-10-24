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
await page.waitForTimeout(800)

// Find Greensleeves
for (let i = 0; i < 20; i++) {
  const song = await page.locator('[aria-live="polite"]').first().textContent()
  if (song?.toLowerCase().includes('greensleeves')) break
  await page.keyboard.press('Tab')
  await page.waitForTimeout(500)
}

await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const fn = document.querySelector('[aria-label="Falling notes lane"]')
  const fnRect = fn?.getBoundingClientRect()
  const notes = Array.from(fn?.querySelectorAll('[class*="note"]') ?? [])
  return notes.map(n => {
    const r = n.getBoundingClientRect()
    const x = Math.round(r.x + r.width / 2 - fnRect.x)
    const bg = n.getAttribute('style')?.match(/var\(--note-([a-g])/)?.[1]
    return { x, bg }
  })
})
console.log('Greensleeves notes:')
console.log(JSON.stringify(info, null, 2))
console.log('minX:', Math.min(...info.map(n => n.x)))
console.log('maxX:', Math.max(...info.map(n => n.x)))
await page.screenshot({ path: '/tmp/greensleeves.png' })
await browser.close()
