/**
 * React Context bridge for ToneManager.
 *
 * Redux stores `selectedTimbreId` (serializable string).
 * A useEffect reads it and calls `toneManager.swapSynth(timbre)` —
 * keeping Tone.js instances out of the Redux store (CLAUDE.md §0).
 */

import { createContext, useContext } from 'react'
import type { ToneManager } from './ToneManager.ts'

const ToneManagerContext = createContext<ToneManager | null>(null)

export const ToneManagerProvider = ToneManagerContext.Provider

export const useToneManager = (): ToneManager => {
  const manager = useContext(ToneManagerContext)
  if (manager === null) {
    throw new Error('useToneManager: missing ToneManagerProvider in the tree')
  }
  return manager
}
