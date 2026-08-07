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
}

const initialState: SongsState = {
  byId: {},
  allIds: [],
  activeSongId: null,
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
  },
})

export const songsActions = songsSlice.actions
export const songsReducer = songsSlice.reducer
