import { test, expect } from '@playwright/test'

test.describe('Play page smoke', () => {
  test('key features render and respond to keyboard', async ({ page }) => {
    await page.goto('/')

    // Unlock audio if gate is present.
    const unlock = page.locator('button:has-text("audio")')
    if (await unlock.isVisible().catch(() => false)) {
      await unlock.click()
    }

    // Core UI elements render.
    await expect(page.locator('[aria-label="Play page"]')).toBeVisible()
    await expect(page.locator('[aria-label="Music notation"]')).toBeVisible()
    await expect(page.locator('[aria-label="Falling notes lane"]')).toBeAttached()
    await expect(page.locator('[aria-label="QWERTY keyboard visualization"]')).toBeAttached()

    // Press Enter — toggle playback. (Cannot assert Tone state from outside.)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // StatusLine should reflect an active song.
    const status = page.locator('[aria-live="polite"]').first()
    await expect(status).toBeVisible()
    const text = (await status.textContent()) ?? ''
    expect(text.length).toBeGreaterThan(0)

    // F toggles falling-notes visibility (canvas exists in either state;
    // we just confirm the page still responds by re-pressing F).
    await page.keyboard.press('f')
    await page.waitForTimeout(150)
    await page.keyboard.press('f')
    await page.waitForTimeout(150)
    await expect(page.locator('[aria-label="Falling notes lane"]')).toBeAttached()
  })
})
