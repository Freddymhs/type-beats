/**
 * /play — F1 QWERTY chiptune studio.
 *
 * This page wires three things:
 *   1. The ToneManager / Redux audio bridge (mounted at root in App.tsx).
 *   2. Window keydown/keyup listeners routed through useQwertyInput.
 *   3. The Unlock gate (browsers require a user gesture before audio starts).
 *
 * VisualPiano and FallingNotes are mounted here once tasks 1.C / 1.D land.
 * The Unlock banner is a temporary UX affordance; once the user clicks,
 * Tone.start() resolves and we hide it.
 */

import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { useQwertyInput } from '../../keyboard/useQwertyInput.ts'
import { useGlobalKeyEvents } from '../../keyboard/useGlobalKeyEvents.ts'
import { useToneManager } from '../../audio/ToneContext.tsx'
import { VisualPiano } from '../../components/VisualPiano/index.ts'
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

  const handleUnlock = useCallback(() => {
    void toneManager.start().then(() => {
      setAudioUnlocked(toneManager.isStarted())
    })
  }, [toneManager])

  // First-key unlock: if the user presses a key before clicking, run the
  // user-gesture path from the keydown event itself so we don't lose the
  // first note to autoplay policy.
  const ensureStarted = useCallback(() => {
    if (!toneManager.isStarted()) {
      void toneManager.start().then(() => {
        setAudioUnlocked(toneManager.isStarted())
      })
    }
  }, [toneManager])

  // Panic on unmount so notes don't keep ringing when navigating away.
  useEffect(() => {
    return () => {
      panic()
    }
  }, [panic])

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      ensureStarted()
      noteOn(event.key)
    },
    [ensureStarted, noteOn],
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
      <VisualPiano />
    </section>
  )
}

export default Play
