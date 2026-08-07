/**
 * TransportBridge — wires Redux songs/audio state into SongTransport.
 *
 * Mounted once at the app root (sibling of <AudioBridge />). Reads:
 *   - songs.activeSongId → which song to schedule
 *   - songs.tempoMultiplier → BPM scaling
 *   - audio.selectedTimbreId → which timbre ToneManager uses
 *
 * Mirrors them into the live SongTransport instance. No DOM, no children.
 *
 * F1 behavior: when activeSongId is null, no scheduling happens. The
 * TransportBridge picks the first PD starter song if state is empty.
 */

import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useToneManager } from '../audio/ToneContext.tsx'
import { getSongTransport } from './SongTransport.ts'
import { PD_STARTER_SONGS } from './index.ts'
import type { RootState } from '../store/index.ts'
import { songsActions } from '../store/songsSlice.ts'
import type { Song } from '../types/index.ts'
import { useAppDispatch } from '../store/hooks.ts'

const DEFAULT_SONG_ID = PD_STARTER_SONGS[0]?.id ?? null

export const TransportBridge = () => {
  const toneManager = useToneManager()
  const dispatch = useAppDispatch()
  const transport = useMemo(() => getSongTransport(toneManager), [toneManager])

  const songsById = useSelector((state: RootState) => state.songs.byId)
  const allIds = useSelector((state: RootState) => state.songs.allIds)
  const activeSongId = useSelector((state: RootState) => state.songs.activeSongId)
  const tempoMultiplier = useSelector((state: RootState) => state.songs.tempoMultiplier)

  // Hydrate PD starter songs on mount (idempotent — upsertSong skips existing).
  useEffect(() => {
    if (allIds.length === 0) {
      for (const song of PD_STARTER_SONGS) {
        dispatch(songsActions.upsertSong(song))
      }
      if (DEFAULT_SONG_ID !== null && activeSongId === null) {
        dispatch(songsActions.setActiveSong(DEFAULT_SONG_ID))
      }
    }
  }, [dispatch, allIds.length, activeSongId])

  // Schedule the active song whenever song or tempo changes.
  useEffect(() => {
    if (activeSongId === null) return
    const song: Song | undefined = songsById[activeSongId]
    if (song === undefined) return
    transport.loadSong(song, tempoMultiplier)
  }, [transport, activeSongId, songsById, tempoMultiplier])

  return null
}
