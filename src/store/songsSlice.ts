/**
 * Songs slice — placeholder for F0. Full library + curation logic lives in F1.
 * Kept here so the store skeleton compiles with the planned shape.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { Note, Song } from '../types/index.ts'

/**
 * Mutable counterpart of Song. The conceptual Song is immutable data
 * but Redux Toolkit uses Immer, which requires mutable drafts in
 * reducers. We strip `readonly` for storage purposes only — slices
 * never mutate individual Note fields directly.
 */
interface MutableSong {
  id: string
  name: string
  source: Song['source']
  notes: Note[]
  tempoBPM: number
  metadata: Song['metadata']
  originalTimbre?: string
}

const toMutableSong = (song: Song): MutableSong => ({
  id: song.id,
  name: song.name,
  source: song.source,
  notes: song.notes as Note[],
  tempoBPM: song.tempoBPM,
  metadata: song.metadata,
  originalTimbre: song.originalTimbre,
})

export interface SongsState {
  byId: Record<string, MutableSong>
  allIds: string[]
  activeSongId: string | null
  tempoMultiplier: number
}

const MIN_TEMPO_MULTIPLIER = 0.5
const MAX_TEMPO_MULTIPLIER = 2.0
const DEFAULT_TEMPO_MULTIPLIER = 1.0

const clampTempoMultiplier = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_TEMPO_MULTIPLIER
  return Math.max(MIN_TEMPO_MULTIPLIER, Math.min(MAX_TEMPO_MULTIPLIER, value))
}

const initialState: SongsState = {
  byId: {},
  allIds: [],
  activeSongId: null,
  tempoMultiplier: DEFAULT_TEMPO_MULTIPLIER,
}

export const songsSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    upsertSong(state, action: PayloadAction<Song>) {
      const song = action.payload
      if (state.byId[song.id] === undefined) {
        state.allIds.push(song.id)
      }
      state.byId[song.id] = toMutableSong(song)
    },
    removeSong(state, action: PayloadAction<string>) {
      const id = action.payload
      if (state.byId[id] === undefined) return
      delete state.byId[id]
      state.allIds = state.allIds.filter((existing) => existing !== id)
      if (state.activeSongId === id) {
        state.activeSongId = null
      }
    },
    setActiveSong(state, action: PayloadAction<string | null>) {
      state.activeSongId = action.payload
    },
    cycleActiveSong(state, action: PayloadAction<1 | -1>) {
      const direction = action.payload
      const { allIds, activeSongId } = state
      if (allIds.length === 0) return
      const currentIndex = activeSongId === null ? -1 : allIds.indexOf(activeSongId)
      const nextIndex =
        currentIndex === -1
          ? direction > 0
            ? 0
            : allIds.length - 1
          : (currentIndex + direction + allIds.length) % allIds.length
      state.activeSongId = allIds[nextIndex] ?? null
    },
    setTempoMultiplier(state, action: PayloadAction<number>) {
      state.tempoMultiplier = clampTempoMultiplier(action.payload)
    },
    bumpTempoMultiplier(state, action: PayloadAction<number>) {
      state.tempoMultiplier = clampTempoMultiplier(state.tempoMultiplier + action.payload)
    },
  },
})

export const SONGS_TEMPO_MIN = MIN_TEMPO_MULTIPLIER
export const SONGS_TEMPO_MAX = MAX_TEMPO_MULTIPLIER
export const SONGS_TEMPO_DEFAULT = DEFAULT_TEMPO_MULTIPLIER

export const songsActions = songsSlice.actions
export const songsReducer = songsSlice.reducer
