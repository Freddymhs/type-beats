/**
 * useTransportActions — pure actions the consumer wires into a keydown
 * handler. Returns `{ cycleNext, cyclePrev, togglePlay, stop, tempoDown,
 * tempoUp }` so the Play page (or any future page) can route keys without
 * owning the listener itself.
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
import { getSongTransport } from './SongTransport.ts'
import type { RootState } from '../store/index.ts'

const TEMPO_STEP = 0.1

export const clampTempo = (value: number): number =>
  Math.max(SONGS_TEMPO_MIN, Math.min(SONGS_TEMPO_MAX, value))

export interface TransportActions {
  readonly cycleNext: () => void
  readonly cyclePrev: () => void
  readonly togglePlay: () => void
  readonly stop: () => void
  readonly tempoDown: () => void
  readonly tempoUp: () => void
}

export const useTransportActions = (): TransportActions => {
  const dispatch = useAppDispatch()
  const toneManager = useToneManager()
  const transport = useMemo(() => getSongTransport(toneManager), [toneManager])
  const activeSongId = useAppSelector((state: RootState) => state.songs.activeSongId)

  const cycleNext = useCallback(() => {
    dispatch(songsActions.cycleActiveSong(1))
  }, [dispatch])

  const cyclePrev = useCallback(() => {
    dispatch(songsActions.cycleActiveSong(-1))
  }, [dispatch])

  const togglePlay = useCallback(() => {
    if (activeSongId === null) return
    const status = transport.getStatus()
    if (status.state === 'started') {
      transport.pause()
    } else {
      transport.play()
    }
  }, [transport, activeSongId])

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

  return { cycleNext, cyclePrev, togglePlay, stop, tempoDown, tempoUp }
}
