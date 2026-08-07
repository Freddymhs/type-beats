/**
 * AudioBridge — wires Redux audio state into the live ToneManager.
 *
 * Per CLAUDE.md §0 discipline: Tone.js instances live in the ToneManager
 * singleton (outside Redux). This component listens to the relevant audio
 * selectors and reflects them in the live synth (swap timbre, set volume).
 *
 * The bridge is mounted once at the app root, NOT inside the route tree —
 * it has no DOM, no children, and survives every navigation.
 */

import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useToneManager } from './ToneContext.tsx'
import { DEFAULT_TIMBRES } from '../types/index.ts'
import type { RootState } from '../store/index.ts'
import type { Timbre } from '../types/index.ts'

const timbreById = new Map(DEFAULT_TIMBRES.map((timbre) => [timbre.id, timbre]))
const FALLBACK_TIMBRE: Timbre = DEFAULT_TIMBRES[0]!

export const AudioBridge = () => {
  const toneManager = useToneManager()
  const selectedTimbreId = useSelector((state: RootState) => state.audio.selectedTimbreId)
  const masterVolume = useSelector((state: RootState) => state.audio.masterVolume)

  useEffect(() => {
    const timbre = timbreById.get(selectedTimbreId) ?? FALLBACK_TIMBRE
    toneManager.swapSynth(timbre)
  }, [toneManager, selectedTimbreId])

  useEffect(() => {
    // masterVolume is normalized 0..1; Tone.js wants dB where 1.0 ≈ 0 dB
    const db = masterVolume <= 0 ? -Infinity : 20 * Math.log10(masterVolume)
    toneManager.setMasterVolumeDb(Number.isFinite(db) ? db : -60)
  }, [toneManager, masterVolume])

  return null
}
