/**
 * React Context provider for the LayoutEngine.
 *
 * F1 ships a single hard-coded layout (Synthesia Classic). The provider
 * compiles it once at mount so consumers get O(1) key → MIDI lookups
 * without rebuilding the Map on every render.
 *
 * When custom layouts land in F2, the provider will read the active
 * layout id from Redux and re-compile on change.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'

import { LayoutEngine } from './LayoutEngine.ts'
import { SYNTHESIA_CLASSIC_LAYOUT } from './SynthesiaClassicLayout.ts'

const LayoutEngineContext = createContext<LayoutEngine | null>(null)

interface LayoutEngineProviderProps {
  readonly children: ReactNode
}

export const LayoutEngineProvider = ({ children }: LayoutEngineProviderProps) => {
  const engine = useMemo(() => new LayoutEngine(SYNTHESIA_CLASSIC_LAYOUT), [])
  return <LayoutEngineContext.Provider value={engine}>{children}</LayoutEngineContext.Provider>
}

export const useLayoutEngine = (): LayoutEngine => {
  const engine = useContext(LayoutEngineContext)
  if (engine === null) {
    throw new Error('useLayoutEngine: missing LayoutEngineProvider in the tree')
  }
  return engine
}
