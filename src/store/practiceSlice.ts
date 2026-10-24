/**
 * Practice slice — hit/miss feedback for "play along" mode.
 *
 * Why this exists: the rest of the app can play songs and light up keys,
 * but the user gets no signal whether their keypress matched an upcoming
 * note. Without that signal the app is just a chiptune player — the
 * practice value proposition is missing.
 *
 * The slice stores:
 *   - hits / misses: counters for the current session (per song)
 *   - lastResult: most recent outcome, used to drive ephemeral feedback
 *     in the StatusLine
 *
 * Hit detection lives in `hitDetectionMiddleware.ts` (a listener
 * middleware that reads `audioActions.noteOn`). It marks matched notes
 * as consumed so the same note can't be claimed twice.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type PracticeResult = 'hit' | 'miss'

export interface PracticeState {
  readonly hits: number
  readonly misses: number
  readonly lastResult: PracticeResult | null
  readonly lastResultAt: number
  readonly currentSongId: string | null
  readonly upcomingHints: ReadonlyArray<number>
}

const initialState: PracticeState = {
  hits: 0,
  misses: 0,
  lastResult: null,
  lastResultAt: 0,
  currentSongId: null,
  upcomingHints: [],
}

export const practiceSlice = createSlice({
  name: 'practice',
  initialState,
  reducers: {
    recordHit(state, action: PayloadAction<{ songId: string; at: number }>) {
      state.hits += 1
      state.lastResult = 'hit'
      state.lastResultAt = action.payload.at
      state.currentSongId = action.payload.songId
    },
    recordMiss(state, action: PayloadAction<{ songId: string; at: number }>) {
      state.misses += 1
      state.lastResult = 'miss'
      state.lastResultAt = action.payload.at
      state.currentSongId = action.payload.songId
    },
    resetPractice(state, action: PayloadAction<{ songId: string }>) {
      state.hits = 0
      state.misses = 0
      state.lastResult = null
      state.lastResultAt = 0
      state.currentSongId = action.payload.songId
      state.upcomingHints = []
    },
    setUpcomingHints(state, action: PayloadAction<ReadonlyArray<number>>) {
      state.upcomingHints = [...action.payload]
    },
  },
})

export const practiceActions = practiceSlice.actions
export const practiceReducer = practiceSlice.reducer
