/**
 * LoopIndicator — minimal in-place visual for the active loop region.
 *
 * Per concept: "intentionally invisible UI" is the norm; loop is the
 * exception because the user explicitly marked it (press `[`/`]`/`L`).
 * Renders nothing when no loop is set; a thin bracket only when active.
 *
 * No transport data — purely a passive reflection of Redux loop state.
 */

import { useSelector } from 'react-redux'

import type { RootState } from '../../store/index.ts'

import styles from './LoopIndicator.module.css'

const formatSeconds = (seconds: number): string => seconds.toFixed(1).padStart(4, ' ')

const shouldRender = (loopStart: number | null, loopEnd: number | null): boolean =>
  loopStart !== null && loopEnd !== null && loopEnd > loopStart

export const LoopIndicator = () => {
  const loopStart = useSelector((state: RootState) => state.songs.loopStart)
  const loopEnd = useSelector((state: RootState) => state.songs.loopEnd)
  const loopEnabled = useSelector((state: RootState) => state.songs.loopEnabled)

  if (!shouldRender(loopStart, loopEnd)) return null

  const startLabel = formatSeconds(loopStart ?? 0)
  const endLabel = formatSeconds(loopEnd ?? 0)
  const state = loopEnabled ? 'on' : 'set'

  return (
    <p className={styles.indicator} data-state={state} aria-label="Loop region">
      <span className={styles.bracket}>[</span>
      <span className={styles.time}>
        {startLabel}s → {endLabel}s
      </span>
      <span className={styles.bracket}>]</span>
      <span className={styles.state}>{loopEnabled ? 'LOOP' : 'armed'}</span>
    </p>
  )
}
