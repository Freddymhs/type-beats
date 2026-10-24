/**
 * StatusLine — ephemeral bottom-of-screen status text.
 *
 * Renders `"<song.name> · <timbre.name> · ♩= <bpm>"` whenever one of the
 * inputs changes, then fades out after 3s. CSS Module handles the 300ms
 * transition between `data-visible="true|false"`.
 *
 * No persistent chrome — appears only on change, per "no traditional UI"
 * rule from the concept.
 */

import { useEffect, useState } from 'react'

import { useAppDispatch, useAppSelector } from '../../store/hooks.ts'
import { practiceActions } from '../../store/practiceSlice.ts'
import { DEFAULT_TIMBRES } from '../../types/index.ts'
import type { RootState } from '../../store/index.ts'

import styles from './StatusLine.module.css'

const FADE_OUT_DELAY_MS = 3000
const PRACTICE_FADE_OUT_DELAY_MS = 1500
const TIMBRE_FALLBACK_NAME = '—'

/**
 * Hit/Miss flash appears centered in the FallingNotes lane (overlaid by
 * FallingNotes via the absolute-positioned slot). Falls back to bottom
 * of viewport when FallingNotes is hidden.
 */

const findTimbreName = (id: string): string => {
  const match = DEFAULT_TIMBRES.find((timbre) => timbre.id === id)
  return match?.name ?? TIMBRE_FALLBACK_NAME
}

export const StatusLine = () => {
  const dispatch = useAppDispatch()
  const song = useAppSelector((state: RootState) => {
    const id = state.songs.activeSongId
    return id === null ? null : (state.songs.byId[id] ?? null)
  })
  const timbreId = useAppSelector((state: RootState) => state.audio.selectedTimbreId)
  const tempoMultiplier = useAppSelector((state: RootState) => state.songs.tempoMultiplier)
  const practice = useAppSelector((state: RootState) => state.practice)

  // Reset hit/miss counters when the active song changes so the score
  // is always per-song (not cumulative across the session).
  const lastResetFor = useAppSelector((state: RootState) => state.practice.currentSongId)
  useEffect(() => {
    if (song === null) return
    if (lastResetFor === song.id) return
    dispatch(practiceActions.resetPractice({ songId: song.id }))
  }, [song, lastResetFor, dispatch])

  // `signature` is the "any of these changed?" signal — recomputed each render.
  const signature = `${song?.id ?? 'none'}|${timbreId}|${tempoMultiplier.toFixed(2)}`
  const [signatureState, setSignatureState] = useState(signature)
  const [visible, setVisible] = useState(true)

  // React-recommended pattern: when an input changes, set state during
  // render instead of inside an effect (avoids the cascading render
  // flagged by react-hooks/set-state-in-effect).
  if (signature !== signatureState) {
    setSignatureState(signature)
    setVisible(true)
  }

  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(() => {
      setVisible(false)
    }, FADE_OUT_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [signatureState, visible])

  if (song === null) return null

  const line = `${song.name} · ${findTimbreName(timbreId)}`
  const effectiveBpm = Math.round(song.tempoBPM * tempoMultiplier)
  const tempoPercent = Math.round(tempoMultiplier * 100)

  // Two persistent counters at the bottom: hits and misses, always visible.
  // These never fade so the user can see their practice progress at a glance.
  const totalAttempts = practice.hits + practice.misses
  const accuracyPct = totalAttempts === 0 ? 0 : Math.round((practice.hits / totalAttempts) * 100)

  return (
    <>
      <p className={styles.status} data-visible={visible} aria-live="polite">
        {line}
      </p>
      <div className={styles.tempoIndicator} aria-label="Tempo">
        <span className={styles.tempoBpm}>♩= {effectiveBpm}</span>
        <span className={styles.tempoPercent}>{tempoPercent}%</span>
        <span className={styles.tempoHint}>← slower · → faster</span>
      </div>
      <div className={styles.counters} aria-label="Practice score">
        <span className={styles.counter} data-kind="hit">
          ✓ {practice.hits}
        </span>
        <span className={styles.counter} data-kind="miss">
          ✗ {practice.misses}
        </span>
        <span className={styles.accuracy}>{accuracyPct}%</span>
      </div>
      <PracticeFlash lastResult={practice.lastResult} lastResultAt={practice.lastResultAt} />
    </>
  )
}

/**
 * Ephemeral "Hit!" / "Miss" toast that appears for ~1.5s on each
 * keypress. Reads `lastResult` from Redux and timestamps itself so
 * repeated presses re-trigger the fade.
 */
const PracticeFlash = ({
  lastResult,
  lastResultAt,
}: {
  lastResult: 'hit' | 'miss' | null
  lastResultAt: number
}) => {
  const [showResult, setShowResult] = useState<{ result: 'hit' | 'miss'; at: number } | null>(null)

  if (lastResult !== null && (showResult === null || showResult.at !== lastResultAt)) {
    setShowResult({ result: lastResult, at: lastResultAt })
  }

  useEffect(() => {
    if (showResult === null) return
    const timer = window.setTimeout(() => {
      setShowResult(null)
    }, PRACTICE_FADE_OUT_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [showResult])

  if (showResult === null) return null
  const label = showResult.result === 'hit' ? '✓ HIT' : '✗ MISS'
  return (
    <p className={styles.flash} data-result={showResult.result} aria-live="polite">
      {label}
    </p>
  )
}
