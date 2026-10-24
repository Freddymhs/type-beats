/**
 * VisualPiano — display-only keyboard, no mouse input.
 *
 * Per BUG-036: 3 rows (Q-U top octave 5, A-J home octave 4, Z-M bottom
 * octave 3). Black keys were removed — W/E/T/Y/U were the previous
 * octave-4 black overlay positions and are now octave-5 whites.
 *
 * Per CLAUDE.md §0: NO mouse/touch handlers. The component is purely a
 * display for QWERTY input. Active notes highlight on press; upcoming
 * notes glow as hints.
 *
 * Each row is rendered as 7 square keys (matching the user's actual
 * keyboard shape — ThinkPad photo confirmed). No piano metaphor.
 */

import { memo, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useLayoutEngine } from '../../layout/LayoutContext.ts'
import { TOP_ROW_KEYS, HOME_ROW_KEYS, BOTTOM_ROW_KEYS } from '../../layout/rowKeys.ts'
import type { RootState } from '../../store/index.ts'

import styles from './VisualPiano.module.css'

const TOP_WHITE_KEYS = TOP_ROW_KEYS
const HOME_WHITE_KEYS = HOME_ROW_KEYS
const BOTTOM_WHITE_KEYS = BOTTOM_ROW_KEYS

interface KeyDescriptor {
  readonly key: string
  readonly label: string
  readonly pitch: number
  readonly isBlack: boolean
}

const buildKeyDescriptors = (
  layoutEngine: ReturnType<typeof useLayoutEngine>,
): ReadonlyArray<KeyDescriptor> => {
  const out: KeyDescriptor[] = []
  for (const key of TOP_WHITE_KEYS) {
    const pitch = layoutEngine.getNote(key)
    if (pitch === undefined) continue
    out.push({ key, label: key.toUpperCase(), pitch, isBlack: false })
  }
  for (const key of HOME_WHITE_KEYS) {
    const pitch = layoutEngine.getNote(key)
    if (pitch === undefined) continue
    out.push({ key, label: key.toUpperCase(), pitch, isBlack: false })
  }
  for (const key of BOTTOM_WHITE_KEYS) {
    const pitch = layoutEngine.getNote(key)
    if (pitch === undefined) continue
    out.push({ key, label: key.toUpperCase(), pitch, isBlack: false })
  }
  return out
}

const WhiteKey = memo(
  ({
    descriptor,
    isPressed,
    isHint = false,
  }: {
    descriptor: KeyDescriptor
    isPressed: boolean
    isHint?: boolean
  }) => {
    const className = [styles.whiteKey, isPressed ? styles.pressed : '', isHint ? styles.hint : '']
      .filter(Boolean)
      .join(' ')
    return (
      <div className={className} data-hint={isHint}>
        <span className={styles.label}>{descriptor.label}</span>
      </div>
    )
  },
)
WhiteKey.displayName = 'WhiteKey'

const VisualPianoComponent = () => {
  const layoutEngine = useLayoutEngine()
  const activeNotes = useSelector((state: RootState) => state.audio.activeNotes)
  const hintPitches = useSelector((state: RootState) => state.practice.upcomingHints)
  const activeSet = useMemo(() => new Set(activeNotes), [activeNotes])
  const hintSet = useMemo(() => new Set(hintPitches), [hintPitches])

  const keys = useMemo(() => buildKeyDescriptors(layoutEngine), [layoutEngine])

  const topKeys = keys.filter(
    (k) => !k.isBlack && TOP_WHITE_KEYS.includes(k.key as (typeof TOP_WHITE_KEYS)[number]),
  )
  const homeKeys = keys.filter(
    (k) => !k.isBlack && HOME_WHITE_KEYS.includes(k.key as (typeof HOME_WHITE_KEYS)[number]),
  )
  const bottomKeys = keys.filter(
    (k) => !k.isBlack && BOTTOM_WHITE_KEYS.includes(k.key as (typeof BOTTOM_WHITE_KEYS)[number]),
  )

  return (
    <div className={styles.piano} aria-label="QWERTY keyboard visualization" aria-hidden="true">
      {/* Row 1: top row (octave 5). No black keys (QWERTYUIOP letters all white). */}
      <div className={styles.row}>
        {topKeys.map((descriptor) => (
          <WhiteKey
            key={descriptor.key}
            descriptor={descriptor}
            isPressed={activeSet.has(descriptor.pitch)}
            isHint={hintSet.has(descriptor.pitch) && !activeSet.has(descriptor.pitch)}
          />
        ))}
      </div>
      {/* Row 2: home row (octave 4). No black overlay (W/E/T/Y/U are now octave-5 whites). */}
      <div className={styles.row}>
        {homeKeys.map((descriptor) => (
          <WhiteKey
            key={descriptor.key}
            descriptor={descriptor}
            isPressed={activeSet.has(descriptor.pitch)}
            isHint={hintSet.has(descriptor.pitch) && !activeSet.has(descriptor.pitch)}
          />
        ))}
      </div>
      {/* Row 3: bottom row (octave 3). */}
      <div className={styles.row}>
        {bottomKeys.map((descriptor) => (
          <WhiteKey
            key={descriptor.key}
            descriptor={descriptor}
            isPressed={activeSet.has(descriptor.pitch)}
            isHint={hintSet.has(descriptor.pitch) && !activeSet.has(descriptor.pitch)}
          />
        ))}
      </div>
    </div>
  )
}

export const VisualPiano = memo(VisualPianoComponent)
