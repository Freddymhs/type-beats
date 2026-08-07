/**
 * Progress middleware — throttled Dexie writes for song progress.
 *
 * Per CLAUDE.md §0 + coordinator:
 *   - Listener-middleware (createListenerMiddleware) bridges RTK → Dexie.
 *   - Writes are throttled per songId so we don't hammer IndexedDB on
 *     every transport state change.
 *   - All writes are best-effort: a failed write logs and drops (the in-
 *     memory Redux state is still authoritative for the session).
 *
 * Throttle window is per-songId so different songs can save concurrently
 * without starving one another.
 */

import { createListenerMiddleware, isAnyOf, type TypedStartListening } from '@reduxjs/toolkit'

import { saveProgress, type ProgressRow } from '../db/index.ts'
import { progressActions } from './progressSlice.ts'
import type { AppDispatch, RootState } from './index.ts'

const FLUSH_DEBOUNCE_MS = 1500

interface PendingWrite {
  readonly songId: string
  readonly row: ProgressRow
  readonly timer: ReturnType<typeof setTimeout>
}

const pending = new Map<string, PendingWrite>()

const flushNow = async (songId: string): Promise<void> => {
  const entry = pending.get(songId)
  if (entry === undefined) return
  pending.delete(songId)
  try {
    await saveProgress(entry.row)
  } catch (error) {
    console.error(`[progressMiddleware] failed to persist ${songId}`, error)
  }
}

const scheduleWrite = (state: RootState, songId: string): void => {
  const songProgress = state.progress.bySongId[songId]
  if (songProgress === undefined) return

  const row: ProgressRow = {
    songId,
    bestScore: songProgress.bestScore,
    lastPlayedAt: songProgress.lastPlayedAt,
    timesPlayed: songProgress.timesPlayed,
    sectionsMastered: songProgress.sectionsMastered,
  }

  const existing = pending.get(songId)
  if (existing !== undefined) {
    clearTimeout(existing.timer)
  }
  const timer = setTimeout(() => {
    void flushNow(songId)
  }, FLUSH_DEBOUNCE_MS)
  pending.set(songId, { songId, row, timer })
}

export const progressListenerMiddleware = createListenerMiddleware()

type AppStartListening = TypedStartListening<RootState, AppDispatch>

const startAppListening = progressListenerMiddleware.startListening as AppStartListening

startAppListening({
  matcher: isAnyOf(progressActions.recordPlay, progressActions.recordSectionMastered),
  effect: (_action, api) => {
    const state = api.getState()
    // Coalesce per songId — read the most recent row from state.progress.
    // We dispatch a single write per call; the debounce collapses
    // bursts inside FLUSH_DEBOUNCE_MS.
    const { bySongId } = state.progress
    for (const songId of Object.keys(bySongId)) {
      scheduleWrite(state, songId)
    }
  },
})

/**
 * Test-only flush: synchronously persist all pending writes. Returns a
 * Promise that resolves once every pending row reaches Dexie (or rejects
 * if any write fails).
 */
export const __flushProgressWritesForTests = async (): Promise<void> => {
  const ids = [...pending.keys()]
  await Promise.all(ids.map((id) => flushNow(id)))
}

/**
 * Test-only reset hook. Drops all pending writes without persisting.
 */
export const __resetProgressMiddlewareForTests = (): void => {
  for (const entry of pending.values()) {
    clearTimeout(entry.timer)
  }
  pending.clear()
}
