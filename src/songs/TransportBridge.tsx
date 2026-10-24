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
import { CURATED_SONGS, PD_STARTER_SONGS } from './index.ts'
import type { RootState } from '../store/index.ts'
import { progressActions } from '../store/progressSlice.ts'
import { songsActions } from '../store/songsSlice.ts'
import type { Song } from '../types/index.ts'
import { useAppDispatch } from '../store/hooks.ts'

const DEFAULT_SONG_ID = CURATED_SONGS[0]?.id ?? PD_STARTER_SONGS[0]?.id ?? null
const SECTION_MASTERED_COOLDOWN_SECONDS = 0.5

// Capture the bridge-start timestamp once at module load so the rAF
// loop can compute "real-world" timestamps without calling Date.now()
// on every tick (CLAUDE.md §0 — no Date.now in hooks/handlers).
const BRIDGE_START_MS = Date.now()
const nowMs = (): number => BRIDGE_START_MS + performance.now()

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

  // Per BUG-023: loopStart/loopEnd are stored in song seconds (set by
  // markLoopIn/Out). Compare with position converted to song seconds.
  const safeMultiplier = tempoMultiplier > 0 ? tempoMultiplier : 1

  const activeSong = activeSongId === null ? null : (songsById[activeSongId] ?? null)
  const songDuration =
    activeSong === null
      ? 0
      : activeSong.notes.reduce((max, note) => Math.max(max, note.startTime + note.duration), 0)

  // Hydrate PD starter songs on mount (idempotent — upsertSong skips existing).
  useEffect(() => {
    if (allIds.length === 0) {
      // Register curated first so Mega Man 1 (CURATED_SONGS[0]) is the
      // first song in cycle order and the default active song.
      for (const song of CURATED_SONGS) {
        dispatch(songsActions.upsertSong(song))
      }
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
      // Per BUG-023: position is wall-clock elapsed. Compare with
      // loopStart/loopEnd (song seconds) by converting position to song
      // seconds via `* safeMultiplier`.
      const songPosition = position * safeMultiplier

      if (loopEnabled && loopStart !== null && loopEnd !== null && loopEnd > loopStart) {
        if (songPosition >= loopEnd && position - lastWrapRef.current > 0.05) {
          if (
            lastSectionRef.current < 0 ||
            songPosition - lastSectionRef.current > SECTION_MASTERED_COOLDOWN_SECONDS
          ) {
            dispatch(
              progressActions.recordSectionMastered({
                songId: activeSong.id,
                timestamp: nowMs(),
              }),
            )
            lastSectionRef.current = songPosition
          }
          // Convert song-second offset back to wall-clock for jumpTo.
          transport.jumpTo(loopStart / safeMultiplier)
          lastWrapRef.current = position
        }
      }

      if (
        songDuration > 0 &&
        songPosition >= songDuration &&
        (lastEndRef.current < 0 || songPosition - lastEndRef.current > songDuration + 1)
      ) {
        dispatch(
          progressActions.recordPlay({
            songId: activeSong.id,
            score: 1,
            timestamp: nowMs(),
          }),
        )
        lastEndRef.current = songPosition
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [
    transport,
    activeSong,
    loopEnabled,
    loopStart,
    loopEnd,
    songDuration,
    dispatch,
    safeMultiplier,
  ])

  return null
}
