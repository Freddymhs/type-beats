/**
 * /play — F1 QWERTY chiptune studio.
 *
 * This page wires three things:
 *   1. The ToneManager / Redux audio bridge (mounted at root in App.tsx).
 *   2. Window keydown/keyup listeners routed through useQwertyInput +
 *      useTransportActions (the page owns a single onKeyDown that
 *      arbitrates between note input and transport commands).
 *   3. The Unlock gate (browsers require a user gesture before audio starts).
 */

import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { useQwertyInput } from '../../keyboard/useQwertyInput.ts'
import { useGlobalKeyEvents } from '../../keyboard/useGlobalKeyEvents.ts'
import { useToneManager } from '../../audio/ToneContext.tsx'
import { TIMBRE_HOTKEY_DIGITS } from '../../audio/timbreRegistry.ts'
import { VisualPiano } from '../../components/VisualPiano/index.ts'
import { FallingNotes } from '../../components/FallingNotes/index.ts'
import { Notation } from '../../components/Notation/index.ts'
import { useTransportActions } from '../../songs/useTransportActions.ts'
import { useAppDispatch } from '../../store/hooks.ts'
import { audioActions } from '../../store/audioSlice.ts'
import { DEFAULT_TIMBRES } from '../../types/index.ts'
import type { RootState } from '../../store/index.ts'

import styles from './Play.module.css'

const UnlockGate = ({ onUnlock }: { onUnlock: () => void }) => (
  <button type="button" className={styles.unlock} onClick={onUnlock}>
    Click to enable audio
  </button>
)

const Play = () => {
  const toneManager = useToneManager()
  const [audioUnlocked, setAudioUnlocked] = useState(toneManager.isStarted())
  const velocity = useSelector((state: RootState) => state.audio.lastVelocity)

  const { noteOn, noteOff, panic, setSustainHeld } = useQwertyInput({ velocity })
  const transport = useTransportActions()
  const dispatch = useAppDispatch()

  const handleUnlock = useCallback(() => {
    void toneManager.start().then(() => {
      setAudioUnlocked(toneManager.isStarted())
    })
  }, [toneManager])

  const ensureStarted = useCallback(() => {
    if (!toneManager.isStarted()) {
      void toneManager.start().then(() => {
        setAudioUnlocked(toneManager.isStarted())
      })
    }
  }, [toneManager])

  useEffect(() => {
    return () => {
      panic()
    }
  }, [panic])

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat) return
      ensureStarted()

      // Alt+digit → switch timbre (Alt+1..5). Hotkey consumes the key so
      // no noteOn runs.
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const digitIndex = TIMBRE_HOTKEY_DIGITS.indexOf(event.key)
        if (digitIndex !== -1 && digitIndex < DEFAULT_TIMBRES.length) {
          event.preventDefault()
          const timbre = DEFAULT_TIMBRES[digitIndex]
          if (timbre !== undefined) {
            dispatch(audioActions.setSelectedTimbre(timbre.id))
          }
          return
        }
      }

      // Transport shortcuts first — they consume the key before any
      // noteOn attempt.
      switch (event.key) {
        case 'Tab': {
          // Cycle songs (Synthesia Classic) and timbres via Tab modifier.
          event.preventDefault()
          if (event.shiftKey) {
            transport.cyclePrev()
            transport.timbreCyclePrev()
          } else {
            transport.cycleNext()
            transport.timbreCycleNext()
          }
          return
        }
        case 'Enter': {
          event.preventDefault()
          transport.togglePlay()
          return
        }
        case 'Escape': {
          event.preventDefault()
          transport.stop()
          return
        }
        case 'ArrowLeft': {
          event.preventDefault()
          transport.tempoDown()
          return
        }
        case 'ArrowRight': {
          event.preventDefault()
          transport.tempoUp()
          return
        }
        case 'F':
        case 'f': {
          // F is the F#4 black-row piano key. Modifier is `\` (single key,
          // no Shift required) so users with Shift+F system shortcuts can
          // still play F#4 without surprises.
          break
        }
        case 'N':
        case 'n': {
          // N is the A3 bottom-row piano key. Modifier is `'` (single key,
          // no Shift required) for the same reason as F.
          break
        }
        case '\\': {
          event.preventDefault()
          transport.toggleFallingNotes()
          return
        }
        case "'": {
          event.preventDefault()
          transport.toggleNotation()
          return
        }
        case '[': {
          event.preventDefault()
          transport.markLoopIn()
          return
        }
        case ']': {
          event.preventDefault()
          transport.markLoopOut()
          return
        }
        case 'Z':
        case 'z': {
          if (event.shiftKey) {
            event.preventDefault()
            transport.octaveDown()
            return
          }
          break
        }
        case 'X':
        case 'x': {
          if (event.shiftKey) {
            event.preventDefault()
            transport.octaveUp()
            return
          }
          break
        }
        default:
          break
      }

      // Space = sustain: hold notes pressed WHILE space is held, release
      // them on Space keyup.
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault()
        setSustainHeld(true)
        return
      }

      noteOn(event.key)
    },
    [ensureStarted, noteOn, transport, dispatch, setSustainHeld],
  )

  const onKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Spacebar') {
        setSustainHeld(false)
        return
      }
      noteOff(event.key)
    },
    [noteOff, setSustainHeld],
  )

  useGlobalKeyEvents({ onKeyDown, onKeyUp })

  return (
    <section className={styles.play} aria-label="Play page">
      {!audioUnlocked && <UnlockGate onUnlock={handleUnlock} />}
      <Notation />
      <FallingNotes />
      <VisualPiano />
      <PortraitNotice />
    </section>
  )
}

const PortraitNotice = () => {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    // Per UV-004 (FASE_1.5 heuristic eval): the bare `(orientation:
    // portrait)` query fired on a landscape 800×600 viewport (likely a
    // Chromium matchMedia quirk on viewports below 600 px tall). Gate
    // on both orientation AND a small width so only phones trigger
    // the notice.
    const query = window.matchMedia('(orientation: portrait) and (max-width: 1024px)')
    // Defer to a microtask so the initial sync read happens after the
    // first render (avoids the cascading-render warning the linter
    // flags for setState inside useEffect).
    queueMicrotask(() => {
      setIsPortrait(query.matches)
    })
    const onChange = (event: MediaQueryListEvent) => {
      setIsPortrait(event.matches)
    }
    query.addEventListener('change', onChange)
    return () => {
      query.removeEventListener('change', onChange)
    }
  }, [])

  return (
    <div className={styles.portraitNotice} data-show={isPortrait} role="status">
      <p>type-beats is designed for landscape. Rotate your device to play.</p>
    </div>
  )
}

export default Play
