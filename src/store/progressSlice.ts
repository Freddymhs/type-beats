/**
 * Progress slice — placeholder for F0. Per-song practice data lands in F1/F2.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface SongProgress {
  readonly bestScore: number
  readonly lastPlayedAt: number
  readonly timesPlayed: number
  readonly sectionsMastered: number
}

export interface ProgressState {
  bySongId: Record<string, SongProgress>
}

const initialState: ProgressState = {
  bySongId: {},
}

export const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    recordPlay(state, action: PayloadAction<{ songId: string; score: number; timestamp: number }>) {
      const { songId, score, timestamp } = action.payload
      const existing = state.bySongId[songId]
      const timesPlayed = (existing?.timesPlayed ?? 0) + 1
      const bestScore = Math.max(existing?.bestScore ?? 0, score)
      const sectionsMastered = existing?.sectionsMastered ?? 0
      state.bySongId[songId] = {
        bestScore,
        lastPlayedAt: timestamp,
        timesPlayed,
        sectionsMastered,
      }
    },
    recordSectionMastered(state, action: PayloadAction<{ songId: string; timestamp: number }>) {
      const { songId, timestamp } = action.payload
      const existing = state.bySongId[songId]
      const sectionsMastered = (existing?.sectionsMastered ?? 0) + 1
      const bestScore = existing?.bestScore ?? 0
      const timesPlayed = existing?.timesPlayed ?? 0
      state.bySongId[songId] = {
        bestScore,
        lastPlayedAt: timestamp,
        timesPlayed,
        sectionsMastered,
      }
    },
    clearProgress(state, action: PayloadAction<string>) {
      delete state.bySongId[action.payload]
    },
  },
})

export const progressActions = progressSlice.actions
export const progressReducer = progressSlice.reducer
