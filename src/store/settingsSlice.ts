/**
 * Settings slice — user preferences that persist across sessions.
 *
 * Per concept: defaultOctave (3..5), velocityCurve, theme.
 * Kept pure data — no audio side effects.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type VelocityCurve = 'linear' | 'log' | 'exp' | 'fixed'
export type Theme = 'dark' | 'light'

export interface SettingsState {
  readonly defaultOctave: number
  readonly velocityCurve: VelocityCurve
  readonly theme: Theme
  readonly defaultTimbreId: string
  readonly showFallingNotes: boolean
  readonly showNotation: boolean
}

const MIN_OCTAVE = 0
const MAX_OCTAVE = 9
const DEFAULT_OCTAVE = 4

const clampOctave = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_OCTAVE
  return Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.trunc(value)))
}

const initialState: SettingsState = {
  defaultOctave: DEFAULT_OCTAVE,
  velocityCurve: 'log',
  theme: 'dark',
  defaultTimbreId: 'square',
  showFallingNotes: true,
  showNotation: true,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setDefaultOctave(state, action: PayloadAction<number>) {
      state.defaultOctave = clampOctave(action.payload)
    },
    setVelocityCurve(state, action: PayloadAction<VelocityCurve>) {
      state.velocityCurve = action.payload
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
    },
    setDefaultTimbreId(state, action: PayloadAction<string>) {
      state.defaultTimbreId = action.payload
    },
    setShowFallingNotes(state, action: PayloadAction<boolean>) {
      state.showFallingNotes = action.payload
    },
    toggleFallingNotes(state) {
      state.showFallingNotes = !state.showFallingNotes
    },
    setShowNotation(state, action: PayloadAction<boolean>) {
      state.showNotation = action.payload
    },
    toggleNotation(state) {
      state.showNotation = !state.showNotation
    },
  },
})

export const settingsActions = settingsSlice.actions
export const settingsReducer = settingsSlice.reducer

export const SETTINGS_OCTAVE_MIN = MIN_OCTAVE
export const SETTINGS_OCTAVE_MAX = MAX_OCTAVE
export const SETTINGS_OCTAVE_DEFAULT = DEFAULT_OCTAVE
