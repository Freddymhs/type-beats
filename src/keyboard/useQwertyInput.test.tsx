/**
 * useQwertyInput — minimal smoke tests over the public handle.
 *
 * We stub `useToneManager` and `useLayoutEngine` via `vi.mock` so the hook
 * can be exercised without dragging the real AudioContext along.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { Provider as ReduxProvider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { ReactNode } from 'react'

import { audioReducer } from '../store/audioSlice.ts'
import { settingsReducer } from '../store/settingsSlice.ts'
import { layoutReducer } from '../store/layoutSlice.ts'
import { progressReducer } from '../store/progressSlice.ts'
import { songsReducer } from '../store/songsSlice.ts'
import { midiPitch } from '../types/index.ts'
import { LayoutEngine } from '../layout/LayoutEngine.ts'
import { SYNTHESIA_CLASSIC_LAYOUT } from '../layout/SynthesiaClassicLayout.ts'

const toneManagerStub = {
  holdNote: vi.fn(),
  releaseNote: vi.fn(),
  panic: vi.fn(),
}

vi.mock('../audio/ToneContext.tsx', () => ({
  ToneManagerProvider: ({ children }: { children: ReactNode }) => children,
  useToneManager: () => toneManagerStub,
}))

vi.mock('../layout/LayoutEngineProvider.tsx', () => ({
  LayoutEngineProvider: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('../layout/LayoutContext.ts', () => ({
  useLayoutEngine: () => new LayoutEngine(SYNTHESIA_CLASSIC_LAYOUT),
}))

import { useQwertyInput } from './useQwertyInput.ts'

const buildStore = () =>
  configureStore({
    reducer: {
      audio: audioReducer,
      settings: settingsReducer,
      layout: layoutReducer,
      progress: progressReducer,
      songs: songsReducer,
    },
  })

const Wrapper = ({ children }: { children: ReactNode }) => (
  <ReduxProvider store={buildStore()}>{children}</ReduxProvider>
)

describe('useQwertyInput', () => {
  beforeEach(() => {
    toneManagerStub.holdNote.mockClear()
    toneManagerStub.releaseNote.mockClear()
  })

  it('holds and releases notes through the toneManager (BUG-046: S=C4)', () => {
    const { result } = renderHook(() => useQwertyInput({ velocity: 100 }), { wrapper: Wrapper })

    act(() => {
      result.current.noteOn('s')
    })
    expect(toneManagerStub.holdNote).toHaveBeenCalledWith(midiPitch(60), expect.anything())

    act(() => {
      result.current.noteOff('s')
    })
    expect(toneManagerStub.releaseNote).toHaveBeenCalledWith(midiPitch(60))
  })

  it('ignores keys that are not in the layout', () => {
    const { result } = renderHook(() => useQwertyInput({ velocity: 100 }), { wrapper: Wrapper })

    act(() => {
      result.current.noteOn('?')
    })
    expect(toneManagerStub.holdNote).not.toHaveBeenCalled()
  })

  it('does not double-trigger on repeated noteOn calls (BUG-046)', () => {
    const { result } = renderHook(() => useQwertyInput({ velocity: 100 }), { wrapper: Wrapper })

    act(() => {
      result.current.noteOn('s')
      result.current.noteOn('s')
    })
    expect(toneManagerStub.holdNote).toHaveBeenCalledTimes(1)
  })
})
