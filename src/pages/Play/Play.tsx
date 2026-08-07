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

  const { noteOn, noteOff, panic } = useQwertyInput({ velocity })
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
        case ' ':
        case 'Spacebar': {
          event.preventDefault()
          if (event.shiftKey) transport.cyclePrev()
          else transport.cycleNext()
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
        default:
          break
      }

      noteOn(event.key)
    },
    [ensureStarted, noteOn, transport, dispatch],
  )

  const onKeyUp = useCallback(
    (event: KeyboardEvent) => {
      noteOff(event.key)
    },
    [noteOff],
  )

  useGlobalKeyEvents({ onKeyDown, onKeyUp })

  return (
    <section className={styles.play} aria-label="Play page">
      {!audioUnlocked && <UnlockGate onUnlock={handleUnlock} />}
      <FallingNotes />
      <VisualPiano />
    </section>
  )
}

export default Play
