/**
 * useQwertyInput — bridges QWERTY keydown/keyup events to ToneManager + Redux.
 *
 * Disciplines (CLAUDE.md):
 *   - Use `event.key` (logical key), not `event.code`. Layout defines the
 *     mapping by `event.key` (e.g. 'a' for the A key in any keyboard layout).
 *   - Reject auto-repeat (event.repeat) — only fire noteOn on first press.
 *   - Ignore modifier-only keypresses (handled by useGlobalModifiers in 1.H).
 *   - Cleanup removes the listener on unmount.
 *
 * Tone.js instances live in ToneManager (outside Redux). We mirror the
 * pressed pitches into Redux activeNotes so VisualPiano / FallingNotes can
 * highlight keys without touching the audio engine.
 *
 * NOTE: velocity depends on Redux state. We mirror audio.lastVelocity into
 * a ref via the `velocityRef` arg so the keydown listener always sees the
 * latest value without re-binding on every state change.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'

import { useToneManager } from '../audio/ToneContext.tsx'
import { useLayoutEngine } from '../layout/LayoutContext.ts'
import { audioActions } from '../store/audioSlice.ts'
import { midiPitch, velocity as makeVelocity } from '../types/index.ts'
import type { MidiPitch } from '../types/index.ts'

const normalizeKey = (key: string): string => (key.length === 1 ? key.toLowerCase() : key)

interface UseQwertyInputOptions {
  /** Current audio.lastVelocity (0..127). Caller updates this ref each render. */
  readonly velocity: number
}

/**
 * Stable handle exposed to the consumer. The consumer attaches keydown/keyup
 * listeners and calls `noteOn(key)` / `noteOff(key)` from them. We also wire
 * window-level listeners internally for convenience — caller can opt out by
 * ignoring the returned `attach` API and rolling their own.
 */
export interface QwertyInputHandle {
  readonly noteOn: (key: string) => void
  readonly noteOff: (key: string) => void
  readonly panic: () => void
  readonly setSustainHeld: (held: boolean) => void
}

export const useQwertyInput = ({ velocity }: UseQwertyInputOptions): QwertyInputHandle => {
  const toneManager = useToneManager()
  const layoutEngine = useLayoutEngine()
  const dispatch = useDispatch()
  const held = useRef<Map<string, MidiPitch>>(new Map())
  const sustainHeld = useRef<boolean>(false)

  // Mirror velocity into a ref so the listener callback reads the latest
  // value without re-binding on every state change (which would lose the
  // currently-pressed key on rerender).
  const velocityRef = useRef(velocity)
  useEffect(() => {
    velocityRef.current = velocity
  }, [velocity])

  const noteOn = useCallback(
    (key: string) => {
      const normalized = normalizeKey(key)
      if (layoutEngine.isModifier(normalized)) return
      const pitch = layoutEngine.getNote(normalized)
      if (pitch === undefined) return
      if (held.current.has(normalized)) return
      const branded = midiPitch(pitch)
      const vel = makeVelocity(velocityRef.current)
      held.current.set(normalized, branded)
      toneManager.holdNote(branded, vel)
      dispatch(audioActions.noteOn(pitch))
    },
    [layoutEngine, toneManager, dispatch],
  )

  const noteOff = useCallback(
    (key: string) => {
      const normalized = normalizeKey(key)
      const pitch = held.current.get(normalized)
      if (pitch === undefined) return
      held.current.delete(normalized)
      if (sustainHeld.current) return
      toneManager.releaseNote(pitch)
      dispatch(audioActions.noteOff(pitch))
    },
    [toneManager, dispatch],
  )

  const panic = useCallback(() => {
    for (const pitch of held.current.values()) {
      toneManager.releaseNote(pitch)
      dispatch(audioActions.noteOff(pitch))
    }
    held.current.clear()
  }, [toneManager, dispatch])

  const setSustainHeld = useCallback(
    (value: boolean) => {
      sustainHeld.current = value
      if (value) return
      // sustain released — drop any pitches still held
      for (const pitch of held.current.values()) {
        toneManager.releaseNote(pitch)
        dispatch(audioActions.noteOff(pitch))
      }
      held.current.clear()
    },
    [toneManager, dispatch],
  )

  return useMemo(
    () => ({ noteOn, noteOff, panic, setSustainHeld }),
    [noteOn, noteOff, panic, setSustainHeld],
  )
}
