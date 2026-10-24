/**
 * HintLane — drives `practice.upcomingHints` to tell VisualPiano which
 * key(s) are about to be hit.
 *
 * On every transport clock tick while a song is playing, look ahead
 * LOOK_AHEAD_SECONDS in the active song and pick the first N
 * NOT-YET-HIT notes whose pitch will sound in that window. Dispatch
 * `practiceActions.setUpcomingHints` with the pitches so VisualPiano
 * can highlight them.
 *
 * Note: we have to read claimed-note ids from the hit-detection module's
 * internal map. We expose it via a ref the module sets on `window` for
 * cross-component access (this is one of the few cases where global
 * state is the cleanest solution — both modules live outside React).
 */

import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

import { useAppDispatch, useAppSelector } from '../../store/hooks.ts'
import { practiceActions } from '../../store/practiceSlice.ts'
import { useTransportClock } from '../../audio/useTransportClock.ts'
import { readClaimedNoteIds } from '../../store/hitDetectionStore.ts'
import type { RootState } from '../../store/index.ts'

const LOOK_AHEAD_SECONDS = 1.2
const MAX_HINTS = 4

const asSeconds = (): number => {
  const transport = Tone.getTransport() as unknown as { seconds?: number; currentTime?: number }
  return transport.seconds ?? transport.currentTime ?? 0
}

export const HintLane = () => {
  const dispatch = useAppDispatch()
  const { running } = useTransportClock()
  const activeSongId = useAppSelector((state: RootState) => state.songs.activeSongId)
  const song = useAppSelector((state: RootState) =>
    state.songs.activeSongId === null ? null : (state.songs.byId[state.songs.activeSongId] ?? null),
  )
  const tempoMultiplier = useAppSelector((state: RootState) => state.songs.tempoMultiplier)
  const lastDispatchedRef = useRef<string>('')

  useEffect(() => {
    let cancelled = false
    let rafId = 0

    const tick = () => {
      if (cancelled) return
      if (!running || activeSongId === null || song === null) {
        if (lastDispatchedRef.current !== '') {
          dispatch(practiceActions.setUpcomingHints([]))
          lastDispatchedRef.current = ''
        }
        rafId = requestAnimationFrame(tick)
        return
      }

      const seconds = asSeconds()
      const claimed = readClaimedNoteIds(activeSongId)
      const upcoming: number[] = []
      // Per BUG-023: note.startTime is song seconds. seconds is wall-clock
      // elapsed. Scale the wall-clock window to song seconds to match.
      const safeMultiplier = tempoMultiplier > 0 ? tempoMultiplier : 1
      const lowerBound = (seconds - 0.05) * safeMultiplier
      const upperBound = (seconds + LOOK_AHEAD_SECONDS) * safeMultiplier

      for (let idx = 0; idx < song.notes.length; idx += 1) {
        const note = song.notes[idx]
        if (note === undefined) continue
        if (claimed.has(`${activeSongId}#${idx}`)) continue
        if (note.startTime < lowerBound) continue
        if (note.startTime > upperBound) break
        upcoming.push(note.pitch)
        if (upcoming.length >= MAX_HINTS) break
      }

      const signature = `${activeSongId}|${seconds.toFixed(2)}|${upcoming.join(',')}`
      if (signature !== lastDispatchedRef.current) {
        dispatch(practiceActions.setUpcomingHints(upcoming))
        lastDispatchedRef.current = signature
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [dispatch, running, activeSongId, song, tempoMultiplier])

  return null
}

export default HintLane
