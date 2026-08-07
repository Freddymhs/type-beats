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

import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import { useToneManager } from '../audio/ToneContext.tsx'
import { getSongTransport } from './SongTransport.ts'
import { PD_STARTER_SONGS } from './index.ts'
import type { RootState } from '../store/index.ts'
import { progressActions } from '../store/progressSlice.ts'
import { songsActions } from '../store/songsSlice.ts'
import type { Song } from '../types/index.ts'
import { useAppDispatch } from '../store/hooks.ts'

const DEFAULT_SONG_ID = PD_STARTER_SONGS[0]?.id ?? null
const SECTION_MASTERED_COOLDOWN_SECONDS = 0.5

export const TransportBridge = () => {
  const toneManager = useToneManager()
  const dispatch = useAppDispatch()
  const transport = useMemo(() => getSongTransport(toneManager), [toneManager])

  const songsById = useSelector((state: RootState) => state.songs.byId)
  const allIds = useSelector((state: RootState) => state.songs.allIds)
  const activeSongId = useSelector((state: RootState) => state.songs.activeSongId)
  const tempoMultiplier = useSelector((state: RootState) => state.songs.tempoMultiplier)
  const loopStart = useSelector((state: RootState) => state.songs.loopStart)
  const loopEnd = useSelector((state: RootState) => state.songs.loopEnd)
  const loopEnabled = useSelector((state: RootState) => state.songs.loopEnabled)
  const lastWrapRef = useRef<number>(0)
  const lastEndRef = useRef<number>(-1)
  const lastSectionRef = useRef<number>(-1)

  const activeSong = activeSongId === null ? null : (songsById[activeSongId] ?? null)
  const songDuration =
    activeSong === null
      ? 0
      : activeSong.notes.reduce((max, note) => Math.max(max, note.startTime + note.duration), 0)

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

  // Loop wrap + progress tracking: when transport time passes `loopEnd`,
  // jump back to `loopStart` and emit a `recordSectionMastered` event.
  // When transport time reaches song end, dispatch `recordPlay`.
  // Driven by rAF so it stays in sync with `Tone.Transport.currentTime`.
  useEffect(() => {
    if (activeSong === null) return
    let rafId = 0
    const tick = () => {
      const position = transport.getCurrentPositionSeconds()

      if (loopEnabled && loopStart !== null && loopEnd !== null && loopEnd > loopStart) {
        if (position >= loopEnd && position - lastWrapRef.current > 0.05) {
          if (
            lastSectionRef.current < 0 ||
            position - lastSectionRef.current > SECTION_MASTERED_COOLDOWN_SECONDS
          ) {
            dispatch(
              progressActions.recordSectionMastered({
                songId: activeSong.id,
                timestamp: Date.now(),
              }),
            )
            lastSectionRef.current = position
          }
          transport.jumpTo(loopStart)
          lastWrapRef.current = position
        }
      }

      if (
        songDuration > 0 &&
        position >= songDuration &&
        (lastEndRef.current < 0 || position - lastEndRef.current > songDuration + 1)
      ) {
        dispatch(
          progressActions.recordPlay({
            songId: activeSong.id,
            score: 1,
            timestamp: Date.now(),
          }),
        )
        lastEndRef.current = position
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [transport, activeSong, loopEnabled, loopStart, loopEnd, songDuration, dispatch])

  return null
}
