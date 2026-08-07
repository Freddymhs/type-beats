/**
 * VisualPiano — display-only keyboard, no mouse input.
 *
 * Renders the Synthesia Classic layout (1 visible octave): home row +
 * black-row offsets. Reads `activeNotes` from Redux to highlight pressed
 * keys. CSS Module only — no inline styles.
 *
 * Per CLAUDE.md §0: NO mouse/touch handlers. The component is purely a
 * display for QWERTY input.
 */

import { memo, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useLayoutEngine } from '../../layout/LayoutContext.ts'
import type { RootState } from '../../store/index.ts'

import styles from './VisualPiano.module.css'

interface KeyDescriptor {
  readonly key: string
  readonly label: string
  readonly pitch: number
  readonly isBlack: boolean
  /** Horizontal offset for black keys (as a fraction of white-key width). */
  readonly offset?: number
}

const HOME_WHITE_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j'] as const
const BOTTOM_WHITE_KEYS = ['z', 'x', 'c', 'v', 'b', 'n', 'm'] as const
const BLACK_KEYS: ReadonlyArray<readonly [string, number]> = [
  // [key, whiteKeyIndexItsBetween (0-based, into HOME row)]
  ['w', 0.65], // C# between a (C) and s (D)
  ['e', 1.65], // D# between s (D) and d (E)
  ['t', 3.5], // F# between f (G) and g (G) — black sits on boundary 3-4
  ['y', 4.5], // G# between g and h
  ['u', 5.5], // A# between h and j
]

const buildKeyDescriptors = (
  layoutEngine: ReturnType<typeof useLayoutEngine>,
): ReadonlyArray<KeyDescriptor> => {
  const out: KeyDescriptor[] = []
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
  for (const [key, offset] of BLACK_KEYS) {
    const pitch = layoutEngine.getNote(key)
    if (pitch === undefined) continue
    out.push({
      key,
      label: key.toUpperCase(),
      pitch,
      isBlack: true,
      offset,
    })
  }
  return out
}

const WhiteKey = memo(
  ({ descriptor, isPressed }: { descriptor: KeyDescriptor; isPressed: boolean }) => (
    <div className={`${styles.whiteKey} ${isPressed ? styles.pressed : ''}`.trim()}>
      <span className={styles.label}>{descriptor.label}</span>
    </div>
  ),
)
WhiteKey.displayName = 'WhiteKey'

const BlackKey = memo(
  ({
    descriptor,
    isPressed,
    offsetPercent,
  }: {
    descriptor: KeyDescriptor
    isPressed: boolean
    offsetPercent: string
  }) => (
    <div
      className={`${styles.blackKey} ${isPressed ? styles.pressed : ''}`.trim()}
      style={{ left: offsetPercent }}
    >
      <span className={styles.label}>{descriptor.label}</span>
    </div>
  ),
)
BlackKey.displayName = 'BlackKey'

const VisualPianoComponent = () => {
  const layoutEngine = useLayoutEngine()
  const activeNotes = useSelector((state: RootState) => state.audio.activeNotes)
  const activeSet = useMemo(() => new Set(activeNotes), [activeNotes])

  const keys = useMemo(() => buildKeyDescriptors(layoutEngine), [layoutEngine])

  const homeKeys = keys.filter(
    (k) => !k.isBlack && HOME_WHITE_KEYS.includes(k.key as (typeof HOME_WHITE_KEYS)[number]),
  )
  const bottomKeys = keys.filter(
    (k) => !k.isBlack && BOTTOM_WHITE_KEYS.includes(k.key as (typeof BOTTOM_WHITE_KEYS)[number]),
  )
  const blackKeys = keys.filter((k) => k.isBlack)

  return (
    <div className={styles.piano} aria-label="QWERTY keyboard visualization" aria-hidden="true">
      <div className={styles.row}>
        {homeKeys.map((descriptor) => (
          <WhiteKey
            key={descriptor.key}
            descriptor={descriptor}
            isPressed={activeSet.has(descriptor.pitch)}
          />
        ))}
        <div className={styles.blackRow}>
          {blackKeys.map((descriptor, index) => {
            // Spread black keys evenly across the home row (7 white keys).
            // Each black key sits centered between two adjacent home-row whites.
            const fallbackOffset = `${((index + 1) * 100) / (blackKeys.length + 1)}%`
            const offsetPair = BLACK_KEYS.find(([k]) => k === descriptor.key)
            const offsetFraction = offsetPair ? offsetPair[1] : undefined
            const offsetPercent =
              offsetFraction === undefined
                ? fallbackOffset
                : `calc(${(offsetFraction * 100) / homeKeys.length}% + 0.5rem)`
            return (
              <BlackKey
                key={descriptor.key}
                descriptor={descriptor}
                isPressed={activeSet.has(descriptor.pitch)}
                offsetPercent={offsetPercent}
              />
            )
          })}
        </div>
      </div>
      <div className={styles.row}>
        {bottomKeys.map((descriptor) => (
          <WhiteKey
            key={descriptor.key}
            descriptor={descriptor}
            isPressed={activeSet.has(descriptor.pitch)}
          />
        ))}
      </div>
    </div>
  )
}

export const VisualPiano = memo(VisualPianoComponent)
