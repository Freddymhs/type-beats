/**
 * Hit detection middleware — turns keypresses into practice outcomes.
 *
 * Listens to `audioActions.noteOn` and answers one question:
 * "did the user hit the next matching note of the active song?"
 *
 * The window is `±HIT_WINDOW_SECONDS` around the current transport
 * position. A pitch that matches within the window → `recordHit`. A
 * keypress with no matching upcoming note → `recordMiss`.
 *
 * `claimedNoteIds` prevents one song note from being scored twice: once
 * a hit is recorded the note id is added to the set and won't match
 * again. The set resets when the song changes (via `practiceActions.resetPractice`).
 *
 * Why a middleware (not a hook): the audio noteOn path runs from the
 * keydown listener regardless of which UI layer triggers it. A listener
 * middleware catches every dispatch, including future ones.
 */

import { createListenerMiddleware, isAnyOf, type TypedStartListening } from '@reduxjs/toolkit'
import * as Tone from 'tone'

import { audioActions } from './audioSlice.ts'
import { practiceActions } from './practiceSlice.ts'
import { claimNote, readClaimedNoteIds, resetClaimedForSong } from './hitDetectionStore.ts'
import type { AppDispatch, RootState } from './index.ts'

const HIT_WINDOW_SECONDS = 0.4

const asTransportSeconds = (): number => {
  const t = Tone.getTransport() as unknown as { seconds?: number; currentTime?: number }
  return t.seconds ?? t.currentTime ?? 0
}

export const hitDetectionMiddleware = createListenerMiddleware()

type AppStartListening = TypedStartListening<RootState, AppDispatch>

const startAppListening = hitDetectionMiddleware.startListening as AppStartListening

startAppListening({
  matcher: isAnyOf(audioActions.noteOn),
  effect: (action, api) => {
    const state = api.getState()
    const activeSongId = state.songs.activeSongId
    if (activeSongId === null) return
    const song = state.songs.byId[activeSongId]
    if (song === undefined) return

    // Only count keypresses while a song is actually playing.
    const transportState = Tone.getTransport().state
    if (transportState !== 'started') return

    const pressedPitch = (action as ReturnType<typeof audioActions.noteOn>).payload
    const transportSeconds = asTransportSeconds()
    const claimed = readClaimedNoteIds(activeSongId)

    let bestHitIndex = -1
    let bestDistance = Number.POSITIVE_INFINITY

    song.notes.forEach((note, idx) => {
      if (claimed.has(`${activeSongId}#${idx}`)) return
      if (note.pitch !== pressedPitch) return
      const distance = Math.abs(note.startTime - transportSeconds)
      if (distance <= HIT_WINDOW_SECONDS && distance < bestDistance) {
        bestDistance = distance
        bestHitIndex = idx
      }
    })

    if (bestHitIndex !== -1) {
      claimNote(activeSongId, bestHitIndex)
      api.dispatch(practiceActions.recordHit({ songId: activeSongId, at: Date.now() }))
    } else {
      api.dispatch(practiceActions.recordMiss({ songId: activeSongId, at: Date.now() }))
    }
  },
})

startAppListening({
  matcher: isAnyOf(practiceActions.resetPractice),
  effect: (action) => {
    const { songId } = (action as ReturnType<typeof practiceActions.resetPractice>).payload
    resetClaimedForSong(songId)
  },
})

/**
 * Test-only reset hook. Drops all claimed-note state. Used by unit tests
 * to keep state isolated between cases.
 */
export const __resetHitDetectionForTests = (): void => {
  // No-op: hitDetectionStore handles its own state per-song.
  void 0
}
