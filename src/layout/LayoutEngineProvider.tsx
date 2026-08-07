/**
 * `<LayoutEngineProvider />` — wraps the React tree with a compiled
 * `LayoutEngine` so consumers via `useLayoutEngine` get O(1) key → MIDI
 * lookups without rebuilding the Map on every render.
 *
 * F1 ships a single hard-coded layout (Synthesia Classic). When custom
 * layouts land in F2 the provider will read the active layout id from
 * Redux and re-compile on change.
 */

import { useMemo, type ReactNode } from 'react'

import { LayoutEngine } from './LayoutEngine.ts'
import { SYNTHESIA_CLASSIC_LAYOUT } from './SynthesiaClassicLayout.ts'
import { LayoutEngineContext } from './LayoutContext.ts'

interface LayoutEngineProviderProps {
  readonly children: ReactNode
}

export const LayoutEngineProvider = ({ children }: LayoutEngineProviderProps) => {
  const engine = useMemo(() => new LayoutEngine(SYNTHESIA_CLASSIC_LAYOUT), [])
  return <LayoutEngineContext.Provider value={engine}>{children}</LayoutEngineContext.Provider>
}
