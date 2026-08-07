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

import { useAppSelector } from '../../store/hooks.ts'
import { DEFAULT_TIMBRES } from '../../types/index.ts'
import type { RootState } from '../../store/index.ts'

import styles from './StatusLine.module.css'

const FADE_OUT_DELAY_MS = 3000
const TIMBRE_FALLBACK_NAME = '—'

const formatBpm = (tempoBPM: number, multiplier: number): string => {
  const effective = Math.round(tempoBPM * multiplier)
  return `♩= ${effective}`
}

const findTimbreName = (id: string): string => {
  const match = DEFAULT_TIMBRES.find((timbre) => timbre.id === id)
  return match?.name ?? TIMBRE_FALLBACK_NAME
}

export const StatusLine = () => {
  const song = useAppSelector((state: RootState) => {
    const id = state.songs.activeSongId
    return id === null ? null : (state.songs.byId[id] ?? null)
  })
  const timbreId = useAppSelector((state: RootState) => state.audio.selectedTimbreId)
  const tempoMultiplier = useAppSelector((state: RootState) => state.songs.tempoMultiplier)

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

  const line = `${song.name} · ${findTimbreName(timbreId)} · ${formatBpm(song.tempoBPM, tempoMultiplier)}`

  return (
    <p className={styles.status} data-visible={visible} aria-live="polite">
      {line}
    </p>
  )
}
