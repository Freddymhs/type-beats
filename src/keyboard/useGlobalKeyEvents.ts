/**
 * useGlobalKeyEvents — attach window keydown/keyup listeners with cleanup.
 *
 * Centralizes listener wiring so multiple features (QWERTY input,
 * modifiers, transport) can subscribe via their own hooks without
 * fighting over the listener. Each subscriber provides a stable
 * handler that ignores keys it doesn't care about.
 *
 * F1 only ships the basic keydown/keyup pair; modifier chords and
 * transport shortcuts arrive in tasks 1.F and 1.H.
 */

import { useEffect } from 'react'

export interface KeyHandlers {
  readonly onKeyDown?: (event: KeyboardEvent) => void
  readonly onKeyUp?: (event: KeyboardEvent) => void
}

export const useGlobalKeyEvents = ({ onKeyDown, onKeyUp }: KeyHandlers) => {
  useEffect(() => {
    if (onKeyDown === undefined && onKeyUp === undefined) return
    const downHandler = onKeyDown ?? null
    const upHandler = onKeyUp ?? null

    if (downHandler !== null) {
      window.addEventListener('keydown', downHandler)
    }
    if (upHandler !== null) {
      window.addEventListener('keyup', upHandler)
    }

    return () => {
      if (downHandler !== null) {
        window.removeEventListener('keydown', downHandler)
      }
      if (upHandler !== null) {
        window.removeEventListener('keyup', upHandler)
      }
    }
  }, [onKeyDown, onKeyUp])
}
