/**
 * React Context for the LayoutEngine (context object + consumer hook only).
 *
 * The `<LayoutEngineProvider />` component lives in `LayoutEngineProvider.tsx`
 * to keep that file's exports purely components. HMR-friendly split.
 *
 * F1 ships a single hard-coded layout (Synthesia Classic). The provider
 * compiles it once at mount so consumers get O(1) key → MIDI lookups
 * without rebuilding the Map on every render.
 *
 * When custom layouts land in F2, the provider will read the active
 * layout id from Redux and re-compile on change.
 */

import { createContext, useContext } from 'react'

import type { LayoutEngine } from './LayoutEngine.ts'

export const LayoutEngineContext = createContext<LayoutEngine | null>(null)

export const useLayoutEngine = (): LayoutEngine => {
  const engine = useContext(LayoutEngineContext)
  if (engine === null) {
    throw new Error('useLayoutEngine: missing LayoutEngineProvider in the tree')
  }
  return engine
}
