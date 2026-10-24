import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { ReactNode } from 'react'

import { VisualPiano } from './VisualPiano.tsx'
import { LayoutEngineContext } from '../../layout/LayoutContext.ts'
import { LayoutEngine as LayoutEngineClass } from '../../layout/LayoutEngine.ts'
import { SYNTHESIA_CLASSIC_LAYOUT } from '../../layout/SynthesiaClassicLayout.ts'
import { songsReducer } from '../../store/songsSlice.ts'
import { audioReducer } from '../../store/audioSlice.ts'
import { settingsReducer } from '../../store/settingsSlice.ts'
import { layoutReducer } from '../../store/layoutSlice.ts'
import { progressReducer } from '../../store/progressSlice.ts'
import { practiceReducer } from '../../store/practiceSlice.ts'

const makeStore = () =>
  configureStore({
    reducer: {
      songs: songsReducer,
      audio: audioReducer,
      settings: settingsReducer,
      layout: layoutReducer,
      progress: progressReducer,
      practice: practiceReducer,
    },
  })

const makeEngine = () => new LayoutEngineClass(SYNTHESIA_CLASSIC_LAYOUT)

const wrapWithProvider = (children: ReactNode) => (
  <Provider store={makeStore()}>
    <LayoutEngineContext.Provider value={makeEngine()}>{children}</LayoutEngineContext.Provider>
  </Provider>
)

describe('VisualPiano — 3-row layout (BUG-036)', () => {
  it('renders 3 row containers', () => {
    const { container } = render(wrapWithProvider(<VisualPiano />))
    // The piano container has 3 child .row divs (top + home + bottom).
    const rows = container.querySelectorAll('[aria-label="QWERTY keyboard visualization"] > div')
    expect(rows.length).toBe(3)
  })

  it('renders exactly 7 top-row white keys (W,E,R,T,U,I,O — Y is gap, BUG-046)', () => {
    const { container } = render(wrapWithProvider(<VisualPiano />))
    const labels = Array.from(
      container.querySelectorAll('[aria-label="QWERTY keyboard visualization"] span'),
    ).map((el) => el.textContent)
    expect(labels).toEqual(expect.arrayContaining(['W', 'E', 'R', 'T', 'U', 'I', 'O']))
  })

  it('renders exactly 7 home-row white keys (S,D,F,G,J,K,L — H is gap, BUG-046)', () => {
    const { container } = render(wrapWithProvider(<VisualPiano />))
    const labels = Array.from(
      container.querySelectorAll('[aria-label="QWERTY keyboard visualization"] span'),
    ).map((el) => el.textContent)
    expect(labels).toEqual(expect.arrayContaining(['S', 'D', 'F', 'G', 'J', 'K', 'L']))
  })

  it('renders exactly 7 bottom-row white keys (Z,X,C,V,N,M,, — B is gap, BUG-046)', () => {
    const { container } = render(wrapWithProvider(<VisualPiano />))
    const labels = Array.from(
      container.querySelectorAll('[aria-label="QWERTY keyboard visualization"] span'),
    ).map((el) => el.textContent)
    expect(labels).toEqual(expect.arrayContaining(['Z', 'X', 'C', 'V', 'N', 'M', ',']))
  })

  it('does NOT render black keys (BUG-036 removed them)', () => {
    const { container } = render(wrapWithProvider(<VisualPiano />))
    // 3 rows × 7 keys = 21 white labels, no black overlay.
    const labels = Array.from(
      container.querySelectorAll('[aria-label="QWERTY keyboard visualization"] span'),
    ).map((el) => el.textContent)
    expect(labels.length).toBe(21)
  })

  it('does NOT render gap keys Y, H, B (BUG-046)', () => {
    const { container } = render(wrapWithProvider(<VisualPiano />))
    const labels = Array.from(
      container.querySelectorAll('[aria-label="QWERTY keyboard visualization"] span'),
    ).map((el) => el.textContent)
    expect(labels).not.toContain('Y')
    expect(labels).not.toContain('H')
    expect(labels).not.toContain('B')
  })
})
