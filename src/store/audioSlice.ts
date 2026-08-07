/**
 * Audio slice — Redux-toolkit-managed audio selection state.
 *
 * Tone.js instances NEVER live here. Only serializable config:
 *   - selectedTimbreId: which timbre the ToneManager should be using
 *   - masterVolume:    0..1 normalized, applied via ToneManager.setMasterVolumeDb
 *
 * The bridge from this slice to the live ToneManager happens in a
 * useEffect that calls `toneManager.swapSynth(timbre)` whenever the
 * selected timbre id changes.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { DEFAULT_TIMBRES, DEFAULT_VELOCITY } from '../types/index.ts'

const FALLBACK_TIMBRE_ID = DEFAULT_TIMBRES[0]?.id ?? 'square'

export interface AudioState {
  readonly selectedTimbreId: string
  readonly masterVolume: number
  readonly lastVelocity: number
}

const initialState: AudioState = {
  selectedTimbreId: FALLBACK_TIMBRE_ID,
  masterVolume: 0.8,
  lastVelocity: DEFAULT_VELOCITY,
}

const clampUnit = (value: number): number => {
  if (!Number.isFinite(value)) return initialState.masterVolume
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    setSelectedTimbre(state, action: PayloadAction<string>) {
      state.selectedTimbreId = action.payload
    },
    setMasterVolume(state, action: PayloadAction<number>) {
      state.masterVolume = clampUnit(action.payload)
    },
    setLastVelocity(state, action: PayloadAction<number>) {
      state.lastVelocity = Math.max(0, Math.min(127, Math.trunc(action.payload)))
    },
  },
})

export const audioActions = audioSlice.actions
export const audioReducer = audioSlice.reducer
