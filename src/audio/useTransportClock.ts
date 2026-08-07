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
 * Returns `null` while paused or before start to let consumers skip work.
 */

import { useEffect, useRef, useState } from 'react'

import * as Tone from 'tone'

export interface TransportClockState {
  /** Transport.currentTime at last rAF tick; null when transport is paused. */
  readonly currentTime: number | null
  /** True if Transport has been started and is currently moving. */
  readonly running: boolean
}

interface TransportLike {
  state: string
  currentTime?: number
}

const asTransportLike = (transport: unknown): TransportLike => transport as TransportLike

const isRunning = (): boolean => {
  try {
    return Tone.getTransport().state === 'started'
  } catch {
    return false
  }
}

const readCurrentTime = (): number | null => {
  try {
    const transport = asTransportLike(Tone.getTransport())
    if (transport.state !== 'started') return null
    return transport.currentTime ?? null
  } catch {
    return null
  }
}

export const useTransportClock = (): TransportClockState => {
  const [state, setState] = useState<TransportClockState>({
    currentTime: readCurrentTime(),
    running: isRunning(),
  })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const running = isRunning()
      const currentTime = running ? readCurrentTime() : null
      setState({ currentTime, running })
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
