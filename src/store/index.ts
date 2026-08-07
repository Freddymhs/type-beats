/**
 * Redux store — F0 skeleton.
 *
 * Slices (per CLAUDE.md discipline):
 *   - audio     → Tone.js selection state (selectedTimbreId, masterVolume)
 *   - songs     → Song library (F0 placeholder; full logic in F1)
 *   - settings  → user prefs (defaultOctave, velocityCurve, theme)
 *   - layout    → active keyboard layout id
 *   - progress  → per-song practice data (F0 placeholder)
 *
 * Tone.js lives in ToneManager singleton — never in store.
 * Full Dexie hydration via createListenerMiddleware arrives in F1.
 */

import { configureStore } from '@reduxjs/toolkit'

import { audioReducer } from './audioSlice.ts'
import { layoutReducer } from './layoutSlice.ts'
import { progressReducer } from './progressSlice.ts'
import { settingsReducer } from './settingsSlice.ts'
import { songsReducer } from './songsSlice.ts'

export const createStore = () =>
  configureStore({
    reducer: {
      audio: audioReducer,
      songs: songsReducer,
      settings: settingsReducer,
      layout: layoutReducer,
      progress: progressReducer,
    },
  })

export const store = createStore()

export type AppStore = ReturnType<typeof createStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
