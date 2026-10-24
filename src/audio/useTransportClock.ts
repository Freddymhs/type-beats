/**
 * useTransportClock — rAF-driven mirror of Tone.Transport.currentTime.
 *
 * Per CLAUDE.md §0 discipline: timing source of truth is
 * `Tone.Transport.currentTime`. We expose it to React via a rAF loop
 * (which is allowed — rAF is a render-driven sync, not an arbitrary timer).
 *
 * No `Date.now()` is used for note timing. Tone.Transport.currentTime is
 * what scheduled notes observe, so we use that as the canonical reference.
 *
 * Per UV-001 (FASE_1.5 heuristic eval): return the last-known value
 * instead of `null` when transport is paused/stopped. `null` made
 * FallingNotes show its empty-state copy forever once Transport auto-
 * stopped at song end, even though audio was still working. Now we
 * freeze at the last observed value so the visual lane recovers
 * naturally; `running` still flips false so consumers can detect the
 * stopped case.
 */

import { useEffect, useRef, useState } from 'react'

import * as Tone from 'tone'

export interface TransportClockState {
  /** Last-observed Transport time; sticky across pause/stop. 0 before first start. */
  readonly currentTime: number
  /** True if Transport has been started at least once. */
  readonly started: boolean
  /** True if Transport is currently moving. */
  readonly running: boolean
}

interface TransportLike {
  state: string
  currentTime?: number
}

const asTransportLike = (transport: unknown): TransportLike => transport as TransportLike

// Module-scoped sticky last-known value. Survives across hook instances
// so a remount doesn't reset the visual cursor.
let lastKnownSeconds = 0
let hasObservedStart = false

const isRunning = (): boolean => {
  try {
    return Tone.getTransport().state === 'started'
  } catch {
    return false
  }
}

const readCurrentTime = (): number => {
  try {
    const transport = asTransportLike(Tone.getTransport())
    // Prefer `seconds` (elapsed time since start) which is a number
    // regardless of audio-context state. Fall back to `currentTime`
    // for older Tone versions where `seconds` may not exist.
    const secondsLike = transport as unknown as { seconds?: number }
    if (typeof secondsLike.seconds === 'number') {
      lastKnownSeconds = secondsLike.seconds
      return lastKnownSeconds
    }
    if (typeof transport.currentTime === 'number') {
      lastKnownSeconds = transport.currentTime
      return lastKnownSeconds
    }
    return lastKnownSeconds
  } catch {
    return lastKnownSeconds
  }
}

export const useTransportClock = (): TransportClockState => {
  const [state, setState] = useState<TransportClockState>({
    currentTime: readCurrentTime(),
    started: hasObservedStart,
    running: isRunning(),
  })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const running = isRunning()
      if (running) hasObservedStart = true
      const currentTime = readCurrentTime()
      setState({ currentTime, started: hasObservedStart, running })
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return state
}

/** Test-only: reset the sticky cursor. */
export const __resetTransportClockForTests = (): void => {
  lastKnownSeconds = 0
  hasObservedStart = false
}
