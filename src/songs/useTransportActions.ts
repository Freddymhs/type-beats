/**
 * useTransportActions — pure actions the consumer wires into a keydown
 * handler. Returns `{ cycleNext, cyclePrev, togglePlay, stop, tempoDown,
 * tempoUp, timbreCycleNext, timbreCyclePrev, octaveUp, octaveDown,
 * toggleFallingNotes }` so the Play page (or any future page) can route
 * keys without owning the listener itself.
 *
 * The previous incarnation `useTransportShortcuts` registered a window
 * listener directly — that collided with useQwertyInput's listener. Folding
 * the dispatch logic into pure actions lets a single onKeyDown in the page
 * arbitrate between note input and transport commands.
 */

import { useCallback, useMemo } from 'react'

import { useToneManager } from '../audio/ToneContext.tsx'
import { useAppDispatch, useAppSelector } from '../store/hooks.ts'
import { songsActions, SONGS_TEMPO_MAX, SONGS_TEMPO_MIN } from '../store/songsSlice.ts'
import { audioActions } from '../store/audioSlice.ts'
import {
  settingsActions,
  SETTINGS_OCTAVE_MAX,
  SETTINGS_OCTAVE_MIN,
} from '../store/settingsSlice.ts'
import { getSongTransport } from './SongTransport.ts'
import { DEFAULT_TIMBRES } from '../types/index.ts'
import type { RootState } from '../store/index.ts'

const TEMPO_STEP = 0.1
const OCTAVE_STEP = 1

export const clampTempo = (value: number): number =>
  Math.max(SONGS_TEMPO_MIN, Math.min(SONGS_TEMPO_MAX, value))

export const clampOctave = (value: number): number =>
  Math.max(SETTINGS_OCTAVE_MIN, Math.min(SETTINGS_OCTAVE_MAX, value))

export interface TransportActions {
  readonly cycleNext: () => void
  readonly cyclePrev: () => void
  readonly togglePlay: () => void
  readonly stop: () => void
  readonly tempoDown: () => void
  readonly tempoUp: () => void
  readonly timbreCycleNext: () => void
  readonly timbreCyclePrev: () => void
  readonly octaveUp: () => void
  readonly octaveDown: () => void
  readonly toggleFallingNotes: () => void
  readonly toggleNotation: () => void
  readonly markLoopIn: () => void
  readonly markLoopOut: () => void
  readonly toggleLoop: () => void
  readonly clearLoop: () => void
}

const timbreIdAt = (index: number): string | undefined => DEFAULT_TIMBRES[index]?.id

export const useTransportActions = (): TransportActions => {
  const dispatch = useAppDispatch()
  const toneManager = useToneManager()
  const transport = useMemo(() => getSongTransport(toneManager), [toneManager])
  const activeSongId = useAppSelector((state: RootState) => state.songs.activeSongId)
  const songsById = useAppSelector((state: RootState) => state.songs.byId)
  const selectedTimbreId = useAppSelector((state: RootState) => state.audio.selectedTimbreId)
  const currentOctave = useAppSelector((state: RootState) => state.settings.defaultOctave)
  const tempoMultiplier = useAppSelector((state: RootState) => state.songs.tempoMultiplier)

  const cycleNext = useCallback(() => {
    dispatch(songsActions.cycleActiveSong(1))
  }, [dispatch])

  const cyclePrev = useCallback(() => {
    dispatch(songsActions.cycleActiveSong(-1))
  }, [dispatch])

  const togglePlay = useCallback(() => {
    if (activeSongId === null) return
    const status = transport.getStatus()
    // Per BUG-032/033: when the song finished naturally, Tone.Transport
    // keeps running but no notes are scheduled (cancelScheduled cleared
    // them). Re-load the song from scratch to re-schedule every note at
    // its correct offset, then play from position 0.
    const song = songsById[activeSongId]
    if (song !== undefined) {
      const songDuration = song.notes.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0)
      if (status.positionSeconds >= songDuration) {
        transport.stop()
        transport.loadSong(song, tempoMultiplier)
        transport.play()
        return
      }
    }
    if (status.state === 'started') {
      transport.pause()
    } else {
      transport.play()
    }
  }, [transport, activeSongId, songsById, tempoMultiplier])

  const stop = useCallback(() => {
    transport.stop()
    toneManager.panic()
    dispatch(audioActions.panicAllNotesOff())
  }, [transport, toneManager, dispatch])

  const tempoDown = useCallback(() => {
    dispatch(songsActions.bumpTempoMultiplier(-TEMPO_STEP))
  }, [dispatch])

  const tempoUp = useCallback(() => {
    dispatch(songsActions.bumpTempoMultiplier(TEMPO_STEP))
  }, [dispatch])

  const timbreCycleNext = useCallback(() => {
    if (DEFAULT_TIMBRES.length === 0) return
    const currentIndex = DEFAULT_TIMBRES.findIndex((timbre) => timbre.id === selectedTimbreId)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % DEFAULT_TIMBRES.length
    const nextId = timbreIdAt(nextIndex)
    if (nextId !== undefined) dispatch(audioActions.setSelectedTimbre(nextId))
  }, [dispatch, selectedTimbreId])

  const timbreCyclePrev = useCallback(() => {
    if (DEFAULT_TIMBRES.length === 0) return
    const currentIndex = DEFAULT_TIMBRES.findIndex((timbre) => timbre.id === selectedTimbreId)
    const previousIndex =
      currentIndex === -1
        ? DEFAULT_TIMBRES.length - 1
        : (currentIndex - 1 + DEFAULT_TIMBRES.length) % DEFAULT_TIMBRES.length
    const previousId = timbreIdAt(previousIndex)
    if (previousId !== undefined) dispatch(audioActions.setSelectedTimbre(previousId))
  }, [dispatch, selectedTimbreId])

  const octaveUp = useCallback(() => {
    dispatch(settingsActions.setDefaultOctave(currentOctave + OCTAVE_STEP))
  }, [dispatch, currentOctave])

  const octaveDown = useCallback(() => {
    dispatch(settingsActions.setDefaultOctave(currentOctave - OCTAVE_STEP))
  }, [dispatch, currentOctave])

  const toggleFallingNotes = useCallback(() => {
    dispatch(settingsActions.toggleFallingNotes())
  }, [dispatch])

  const toggleNotation = useCallback(() => {
    dispatch(settingsActions.toggleNotation())
  }, [dispatch])

  const markLoopIn = useCallback(() => {
    // Per BUG-023: store loop boundaries in song seconds so tempo changes
    // don't shift the region. transport.getCurrentPositionSeconds() is
    // wall-clock elapsed; multiply by tempoMultiplier to convert.
    const safeMultiplier = tempoMultiplier > 0 ? tempoMultiplier : 1
    dispatch(songsActions.setLoopStart(transport.getCurrentPositionSeconds() * safeMultiplier))
  }, [dispatch, transport, tempoMultiplier])

  const markLoopOut = useCallback(() => {
    const safeMultiplier = tempoMultiplier > 0 ? tempoMultiplier : 1
    dispatch(songsActions.setLoopEnd(transport.getCurrentPositionSeconds() * safeMultiplier))
  }, [dispatch, transport, tempoMultiplier])

  const toggleLoop = useCallback(() => {
    dispatch(songsActions.toggleLoop())
  }, [dispatch])

  const clearLoop = useCallback(() => {
    dispatch(songsActions.clearLoop())
  }, [dispatch])

  return {
    cycleNext,
    cyclePrev,
    togglePlay,
    stop,
    tempoDown,
    tempoUp,
    timbreCycleNext,
    timbreCyclePrev,
    octaveUp,
    octaveDown,
    toggleFallingNotes,
    toggleNotation,
    markLoopIn,
    markLoopOut,
    toggleLoop,
    clearLoop,
  }
}
