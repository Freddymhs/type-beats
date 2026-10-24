/**
 * Redux store — F0 skeleton + F2 listener middleware.
 *
 * Slices (per CLAUDE.md discipline):
 *   - audio     → Tone.js selection state (selectedTimbreId, masterVolume)
 *   - songs     → Song library (F0 placeholder; full logic in F1)
 *   - settings  → user prefs (defaultOctave, velocityCurve, theme)
 *   - layout    → active keyboard layout id
 *   - progress  → per-song practice data (F0 placeholder)
 *
 * Tone.js lives in ToneManager singleton — never in store.
 * Dexie write bridge: `progressListenerMiddleware` (F2) throttles
 * per-song progress writes.
 */

import { configureStore } from '@reduxjs/toolkit'

import { audioReducer } from './audioSlice.ts'
import { hitDetectionMiddleware } from './hitDetectionMiddleware.ts'
import { layoutReducer } from './layoutSlice.ts'
import { practiceReducer } from './practiceSlice.ts'
import { progressListenerMiddleware } from './progressMiddleware.ts'
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
      practice: practiceReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(progressListenerMiddleware.middleware)
        .prepend(hitDetectionMiddleware.middleware),
  })

export const store = createStore()

export type AppStore = ReturnType<typeof createStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
