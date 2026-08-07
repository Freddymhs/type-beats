import { test, expect } from '@playwright/test'

test('home redirects to the play page with the studio mounted', async ({ page }) => {
  await page.goto('/')

  // The studio's Play page is the app entry — F1 has no traditional
  // landing page (keyboard-first flow state per concept).
  await expect(page.locator('[aria-label="Play page"]')).toBeVisible()
  await expect(page.locator('[aria-label="QWERTY keyboard visualization"]')).toBeAttached()
  await expect(page.locator('[aria-label="Music notation"]')).toBeVisible()
})
