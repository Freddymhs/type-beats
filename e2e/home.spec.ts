import { test, expect } from '@playwright/test'

test('home page loads and shows the type-beats heading', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'type-beats' })).toBeVisible()
})
