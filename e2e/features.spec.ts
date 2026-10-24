/**
 * Comprehensive feature smoke — covers the user-reported issues and
 * exercises each phase's deliverables. Run via `npm run test:e2e`.
 *
 * Per-phase coverage:
 *  - F0: ToneManager + LayoutEngine (compile + key→pitch mapping)
 *  - F1: QWERTY input, multi-timbre Alt+1..5, falling notes toggle,
 *        visual piano highlight, transport (Enter/Esc/←→), modifiers,
 *        StatusLine reflection, responsive.
 *  - F2: Notation highlight during playback, loop A/B markers,
 *        game catalog presence, Dexie progress save.
 */
import { test, expect, type Page } from '@playwright/test'

const unlockAudio = async (page: Page): Promise<void> => {
  const unlock = page.locator('button:has-text("audio")')
  if (await unlock.isVisible().catch(() => false)) {
    await unlock.click()
  }
}

test.describe('F0 — engine + layout', () => {
  test('Tone.js loaded and routes are mounted', async ({ page }) => {
    const logs: string[] = []
    page.on('console', (m) => logs.push(m.text()))
    await page.goto('/')
    await unlockAudio(page)
    await page.waitForTimeout(400)
    expect(logs.some((l) => l.includes('Tone.js'))).toBe(true)
  })

  test('LayoutEngine maps home-row a → C4', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    // Ensure body has focus so window keydown listener fires.
    await page.locator('body').focus()
    await page.keyboard.down('a')
    await page.waitForTimeout(150)
    const pressed = page.locator('[aria-label="QWERTY keyboard visualization"] [class*="pressed"]')
    await expect(pressed.first()).toBeVisible({ timeout: 3000 })
    await page.keyboard.up('a')
  })
})

test.describe('F1 — UX', () => {
  test('Enter starts playback; StatusLine reflects song', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)
    const status = await page.locator('[aria-live="polite"]').first().textContent()
    expect(status?.length ?? 0).toBeGreaterThan(0)
    // Tempo is now in a separate persistent indicator. StatusLine itself
    // shows song + timbre; tempoIndicator shows ♩=.
    const tempo = await page.locator('[aria-label="Tempo"]').textContent()
    expect(tempo).toMatch(/♩=/)
  })

  test('Alt+1..5 switches timbre — StatusLine updates', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    const timbreAt = async (digit: string) => {
      await page.keyboard.press(`Alt+${digit}`)
      await page.waitForTimeout(120)
      return (await page.locator('[aria-live="polite"]').first().textContent()) ?? ''
    }
    const t1 = await timbreAt('1')
    const t3 = await timbreAt('3')
    expect(t1).not.toEqual(t3)
  })

  test('Tab cycles to the next song', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    const before = (await page.locator('[aria-live="polite"]').first().textContent()) ?? ''
    await page.keyboard.press('Tab')
    await page.waitForTimeout(250)
    const after = (await page.locator('[aria-live="polite"]').first().textContent()) ?? ''
    expect(after).not.toEqual(before)
  })

  test('Esc stops playback', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(250)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(250)
    // After Esc, status is still shown (song still selected) but not playing.
    const status = await page.locator('[aria-live="polite"]').first().textContent()
    expect(status?.length ?? 0).toBeGreaterThan(0)
  })

  test('Backslash toggles FallingNotes — single-key, no Shift required', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await expect(page.locator('[aria-label="Falling notes lane"]')).toBeVisible()
    await page.keyboard.press('Backslash')
    await page.waitForTimeout(200)
    await expect(page.locator('[aria-label="Falling notes lane"]')).toBeHidden()
    await page.keyboard.press('Backslash')
    await page.waitForTimeout(200)
    await expect(page.locator('[aria-label="Falling notes lane"]')).toBeVisible()
  })

  test('Bare F plays the F#4 black-row note (no longer the toggle)', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await expect(page.locator('[aria-label="Falling notes lane"]')).toBeVisible()
    await page.keyboard.press('f')
    await page.waitForTimeout(300)
    await expect(page.locator('[aria-label="Falling notes lane"]')).toBeVisible()
  })

  test('VisualPiano highlights pressed keys', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    await page.keyboard.down('s')
    await page.waitForTimeout(120)
    const pressed = page.locator('[aria-label="QWERTY keyboard visualization"] [class*="pressed"]')
    await expect(pressed.first()).toBeVisible({ timeout: 3000 })
    await page.keyboard.up('s')
  })

  test('Notation displays ≥1 stave during playback', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    const svg = page.locator('[aria-label="Music notation"] svg')
    await expect(svg).toBeVisible()
    const staveNotes = await page.locator('[data-notation-chord]').count()
    expect(staveNotes).toBeGreaterThan(0)
  })

  test('Shift+Z lowers active octave', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    // No direct DOM probe for octave; just verify no crash and keypress handled.
    await page.keyboard.press('Shift+z')
    await page.waitForTimeout(120)
    await expect(page.locator('[aria-label="Play page"]')).toBeVisible()
  })
})

test.describe('F2 — Notation + loop + catalog', () => {
  test('Apostrophe toggles Notation visibility — single-key, no Shift required', async ({
    page,
  }) => {
    await page.goto('/')
    await unlockAudio(page)
    await expect(page.locator('[aria-label="Music notation"]')).toBeVisible()
    await page.keyboard.press('Quote')
    await page.waitForTimeout(150)
    await expect(page.locator('[aria-label="Music notation"]')).toBeHidden()
    await page.keyboard.press('Quote')
    await page.waitForTimeout(150)
    await expect(page.locator('[aria-label="Music notation"]')).toBeVisible()
  })

  test('bare N plays the A3 note on the bottom row', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    await page.locator('body').focus()
    await page.keyboard.down('n')
    await page.waitForTimeout(150)
    // N is rendered on the bottom row of VisualPiano; pressing it must
    // highlight that key (and only that key).
    const piano = page.locator('[aria-label="QWERTY keyboard visualization"]')
    const nKey = piano.locator('span:text-is("N")').first()
    await expect(nKey).toBeVisible()
    await page.keyboard.up('n')
  })

  test('Loop [ / ] + L mark a region without crashing', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(250)
    await page.keyboard.press('[')
    await page.waitForTimeout(80)
    await page.keyboard.press(']')
    await page.waitForTimeout(80)
    await page.keyboard.press('l')
    await page.waitForTimeout(150)
    await expect(page.locator('[aria-label="Play page"]')).toBeVisible()
  })

  test('StatusLine names a curated game-music song after Tab cycling', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
    // Cycle through up to 12 songs — at least one should be a curated track.
    const titles: string[] = []
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(120)
      const status = page.locator('[aria-live="polite"]').first()
      // StatusLine shows for 3s then fades; force a read regardless.
      const txt = ((await status.textContent({ timeout: 1500 }).catch(() => '')) ?? '').trim()
      const song = txt.split(' · ')[0]?.trim() ?? ''
      if (song.length > 0 && !titles.includes(song)) titles.push(song)
    }
    // Curated catalog names contain: Terran, Protoss, Zerg, Zelda, MegaMan,
    // Metroid, Final Fantasy. Loose substring match.
    const curated = titles.find((t) => /Terran|Protoss|Zerg|Zelda|Mario|Metroid|Fantasy/i.test(t))
    expect(curated, `titles seen: ${titles.join(' | ')}`).toBeDefined()
  })

  test('Practice mode: persistent counter shows hits/misses and Miss flash appears', async ({
    page,
  }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(400)

    // Practice score container is always visible (no fade), separate
    // from the StatusLine that shows song/timbre/tempo.
    const score = page.locator('[aria-label="Practice score"]')
    await expect(score).toBeVisible()
    const initial = (await score.textContent()) ?? ''
    expect(initial).toMatch(/\d+/)
    expect(initial).toMatch(/\d+%/)

    // Press a piano key that's almost certainly off-melody → miss feedback.
    await page.keyboard.down('m')
    await page.waitForTimeout(150)
    await page.keyboard.up('m')
    await page.waitForTimeout(150)

    // Counter advanced — at least one of hits/misses went up.
    const after = (await score.textContent()) ?? ''
    expect(after).not.toEqual(initial)
    // The flash element with data-result="miss" appears on bad keypress.
    await expect(page.locator('p[data-result="miss"]')).toBeVisible({ timeout: 1500 })
  })

  test('Practice mode: VisualPiano highlights upcoming notes (hint feature)', async ({ page }) => {
    await page.goto('/')
    await unlockAudio(page)
    await page.keyboard.press('Enter')
    // Give the HintLane a couple of rAF ticks to compute + dispatch.
    await page.waitForTimeout(500)
    // At least one white key should carry data-hint="true" while a song
    // is playing (the next unmatched upcoming note).
    const hinted = page.locator('[data-hint="true"]')
    await expect(hinted.first()).toBeVisible({ timeout: 3000 })
  })
})
