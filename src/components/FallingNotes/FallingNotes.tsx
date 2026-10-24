/**
 * FallingNotes — practice/memory lane driven by `Tone.Transport.currentTime`.
 *
 * Per CLAUDE.md §0 discipline: NO `Date.now()` for note timing.
 * The component reads `currentTime` from `useTransportClock` (which mirrors
 * `Tone.Transport.currentTime` via rAF) and computes each note's Y offset
 * from the formula:
 *
 *     y = (startTime - currentTime) * pixelsPerSecond  // negative → above hit line
 *
 * CSS does the actual animation (`transform: translateY()`). React re-renders
 * each rAF tick to update the transform value; this is intentional because
 * scheduling accuracy is bound to AudioContext time, not wall clock.
 *
 * For F1 we render only notes whose startTime is within `LOOK_AHEAD_SECONDS`
 * of currentTime, plus a small look-behind so we don't pop in/out abruptly.
 */

import { memo, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import { useTransportClock } from '../../audio/useTransportClock.ts'
import { useLayoutEngine } from '../../layout/LayoutContext.ts'
import { pitchClassToSemitone } from '../../types/index.ts'
import type { Note } from '../../types/index.ts'
import type { RootState } from '../../store/index.ts'

import {
  FALLING_NOTES_LOOK_AHEAD_SECONDS as LOOK_AHEAD_SECONDS,
  FALLING_NOTES_LOOK_BEHIND_SECONDS as LOOK_BEHIND_SECONDS,
  FALLING_NOTES_PIXELS_PER_SECOND as PIXELS_PER_SECOND_FALLBACK,
  FALLING_NOTES_HIT_LINE_HEIGHT_REM as HIT_LINE_HEIGHT_REM,
  FALLING_NOTES_HIT_LINE_OFFSET_PX as HIT_LINE_OFFSET_PX,
  FALLING_NOTES_PRE_ROLL_SECONDS as PRE_ROLL_SECONDS,
} from './FallingNotes.constants.ts'

import { useElementHeight } from './useElementHeight.ts'

import styles from './FallingNotes.module.css'

const PITCH_COLORS = [
  'var(--note-c)',
  'var(--note-c)',
  'var(--note-d)',
  'var(--note-d)',
  'var(--note-e)',
  'var(--note-f)',
  'var(--note-f)',
  'var(--note-g)',
  'var(--note-g)',
  'var(--note-a)',
  'var(--note-a)',
  'var(--note-b)',
] as const

const pitchColor = (midiPitch: number): string => {
  const semitone = ((midiPitch % 12) + 12) % 12
  return PITCH_COLORS[semitone] ?? 'var(--note-c)'
}

// Per BUG-027 + BUG-031 + BUG-036: FallingNotes aligns with the 3-row
// QWERTY piano. Each QWERTY key occupies 1/7 of the piano width. Octaves
// 3 (Z-M), 4 (A-J) and 5 (Q-U) share the same horizontal range; they're
// vertically stacked on the piano.

const WHITE_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  // [pitch, fractional index (0..6) across the 7-key row]
  [48, 0], // C3 → Z
  [50, 1], // D3 → X
  [52, 2], // E3 → C
  [53, 3], // F3 → V
  [55, 4], // G3 → B
  [57, 5], // A3 → N
  [59, 6], // B3 → M
  [60, 0], // C4 → A
  [62, 1], // D4 → S
  [64, 2], // E4 → D
  [65, 3], // F4 → F
  [67, 4], // G4 → G
  [69, 5], // A4 → H
  [71, 6], // B4 → J
  // Per BUG-036: octave 5 row (Q-U) shares the same horizontal range.
  [72, 0], // C5 → Q
  [74, 1], // D5 → W
  [76, 2], // E5 → E
  [77, 3], // F5 → R
  [79, 4], // G5 → T
  [81, 5], // A5 → Y
  [83, 6], // B5 → U
]

const isPitchInRange = (midiPitch: number): boolean => midiPitch >= 48 && midiPitch <= 83

const noteOffsetFraction = (
  midiPitch: number,
  _layoutEngine: ReturnType<typeof useLayoutEngine>,
): number => {
  // Match the 2-row QWERTY piano exactly. Each QWERTY key takes 1/7 of
  // the row; black keys are positioned between adjacent whites.
  // Range 0..1 across the piano width.
  for (const [pitch, fraction] of WHITE_OFFSETS) {
    if (pitch === midiPitch) return fraction / 7
  }
  // C#4 (61), D#4 (63) sit between A-S and S-D
  if (midiPitch === 61) return 0.65 / 7
  if (midiPitch === 63) return 1.65 / 7
  return 0.5
}

const computeTransformY = (
  noteStart: number,
  currentTime: number,
  tempoMultiplier: number,
  pixelsPerSecond: number,
): number => {
  // Per BUG-023: noteStart is in original song seconds. currentTime is
  // wall-clock seconds since transport.start(). They diverge when
  // tempoMultiplier != 1. Convert noteStart to wall-clock by dividing
  // by tempoMultiplier (slower tempo → note fires later in wall time).
  // Per BUG-035: PRE_ROLL_SECONDS delays audio so the user has time to
  // see notes falling and prepare their hands. Same offset is applied in
  // SongTransport.scheduleNotes so audio fires when the visual reaches
  // the hit line, not before.
  // Per BUG-035b: pixelsPerSecond is computed dynamically from the canvas
  // height so notes always fill the available vertical space, regardless
  // of viewport size.
  const safeMultiplier = tempoMultiplier > 0 ? tempoMultiplier : 1
  const wallStart = PRE_ROLL_SECONDS + noteStart / safeMultiplier
  const delta = wallStart - currentTime
  const yPx = -delta * pixelsPerSecond
  return yPx
}

interface RenderedNoteProps {
  readonly note: Note
  readonly currentTime: number
  readonly isPressed: boolean
  readonly layoutEngine: ReturnType<typeof useLayoutEngine>
  readonly pixelsPerSecond: number
}

// Per BUG-037: each octave's notes get a small vertical offset so notes
// for the same column from different octaves don't visually merge. The
// hit line stays the same — all rows converge there — but during the
// fall the user can tell which row a note belongs to.
const OCTAVE_VERTICAL_OFFSET_PX: Record<number, number> = {
  3: 24,
  4: 0,
  5: -24,
}

const RenderedNote = memo(
  ({ note, currentTime, isPressed, layoutEngine, pixelsPerSecond }: RenderedNoteProps) => {
    const tempoMultiplier = useSelector((state: RootState) => state.songs.tempoMultiplier)
    const translateY = computeTransformY(
      note.startTime,
      currentTime,
      tempoMultiplier,
      pixelsPerSecond,
    )
    const safeMultiplier = tempoMultiplier > 0 ? tempoMultiplier : 1
    const wallStart = PRE_ROLL_SECONDS + note.startTime / safeMultiplier
    const delta = wallStart - currentTime
    const leftPct = `${(noteOffsetFraction(note.pitch, layoutEngine) * 100).toFixed(2)}%`
    const color = pitchColor(note.pitch)
    const inRange = isPitchInRange(note.pitch)
    const octave = Math.floor(note.pitch / 12) - 1
    const verticalOffset = OCTAVE_VERTICAL_OFFSET_PX[octave] ?? 0
    const keyLabel = layoutEngine.getKey(note.pitch)?.toUpperCase() ?? ''
    // Per BUG-041: aggressive fade-in so notes only become visible in
    // the BOTTOM half of the canvas (delta < LOOK_AHEAD_SECONDS / 2).
    // Notes in the top half are completely invisible. Combined with
    // PRE_ROLL_SECONDS = 3, the user sees a 3-second countdown with
    // notes streaming in from the middle of the canvas — they don't
    // "all appear at once" at the top.
    const fadeInOpacity = inRange
      ? Math.max(0, Math.min(1, (LOOK_AHEAD_SECONDS - delta) / (LOOK_AHEAD_SECONDS / 2)))
      : 0.45
    const className = [
      styles.note,
      isPressed ? styles.notePressed : '',
      !inRange ? styles.noteOutOfRange : '',
    ]
      .filter(Boolean)
      .join(' ')
    // The pitch semitone derived from pitchClassToSemitone is unused here; we
    // use midi-pitch modulo for color which is direct & deterministic.
    void pitchClassToSemitone

    return (
      <div
        className={className}
        style={{
          left: leftPct,
          bottom: `${HIT_LINE_HEIGHT_REM}rem`,
          transform: `translate3d(0, ${translateY + verticalOffset}px, 0)`,
          background: color,
          opacity: fadeInOpacity,
        }}
      >
        {keyLabel !== '' && <span className={styles.label}>{keyLabel}</span>}
      </div>
    )
  },
)
RenderedNote.displayName = 'RenderedNote'

interface FallingNotesProps {
  /** Optional override; defaults to the active song in Redux. */
  readonly notes?: ReadonlyArray<Note>
}

const FallingNotesComponent = ({ notes }: FallingNotesProps) => {
  const { currentTime, started } = useTransportClock()
  const layoutEngine = useLayoutEngine()
  const activeSongId = useSelector((state: RootState) => state.songs.activeSongId)
  const songsById = useSelector((state: RootState) => state.songs.byId)
  const loopStart = useSelector((state: RootState) => state.songs.loopStart)
  const loopEnd = useSelector((state: RootState) => state.songs.loopEnd)
  const loopEnabled = useSelector((state: RootState) => state.songs.loopEnabled)
  const tempoMultiplier = useSelector((state: RootState) => state.songs.tempoMultiplier)
  const showFallingNotes = useSelector(
    (state: RootState) => state.settings.showFallingNotes ?? true,
  )
  const activeNotes = useSelector((state: RootState) => state.audio.activeNotes)
  const activeNotesSet = useMemo(() => new Set(activeNotes), [activeNotes])

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const canvasHeight = useElementHeight(canvasRef)

  // Per BUG-035b: scale PIXELS_PER_SECOND so the LOOK_AHEAD_SECONDS window
  // matches the canvas height exactly. With a fixed pixelsPerSecond, notes
  // get clipped above the canvas top on short viewports — user sees notes
  // "stuck" near the top because they're rendered outside the visible area.
  // pixelsPerSecond = (canvasHeight - hitLineOffset) / LOOK_AHEAD_SECONDS.
  // Fallback to the constant until the first measurement arrives.
  const pixelsPerSecond = useMemo<number>(() => {
    if (canvasHeight === null || canvasHeight <= HIT_LINE_OFFSET_PX) {
      return PIXELS_PER_SECOND_FALLBACK
    }
    const available = canvasHeight - HIT_LINE_OFFSET_PX
    return available / LOOK_AHEAD_SECONDS
  }, [canvasHeight])

  const sourceNotes = useMemo<ReadonlyArray<Note>>(() => {
    if (notes !== undefined) return notes
    if (activeSongId === null) return []
    const song = songsById[activeSongId]
    return song?.notes ?? []
  }, [notes, activeSongId, songsById])

  // When loop is active, restrict the visible notes to the loop region.
  // Notes outside the loop won't be played (transport wraps) so showing
  // them confuses the user into thinking they'll have to play them.
  const loopedNotes = useMemo<ReadonlyArray<Note>>(() => {
    if (!loopEnabled || loopStart === null || loopEnd === null) return sourceNotes
    if (loopEnd <= loopStart) return sourceNotes
    return sourceNotes.filter((n) => n.startTime >= loopStart && n.startTime < loopEnd)
  }, [sourceNotes, loopEnabled, loopStart, loopEnd])

  if (!showFallingNotes) {
    return <div className={`${styles.canvas} ${styles.hidden}`} aria-hidden="true" />
  }

  if (sourceNotes.length === 0) {
    return (
      <div className={styles.canvas} aria-label="Falling notes lane">
        <div className={styles.hitLine} />
        <div className={styles.hitLineGlow} />
        <div className={styles.empty}>No song loaded. Press Enter to start.</div>
      </div>
    )
  }

  // Before the first transport start we have no anchor — render the
  // empty lane with "Press Enter" copy. After the first start the
  // cursor freezes at the last-known value (UV-001), so we render the
  // canvas regardless of pause/stop.
  if (!started) {
    return (
      <div className={styles.canvas} aria-label="Falling notes lane">
        <div className={styles.hitLine} />
        <div className={styles.hitLineGlow} />
        <div className={styles.empty}>Press Enter to start playback.</div>
      </div>
    )
  }

  // Per BUG-038: countdown overlay during pre-roll. Notes are visible
  // behind it (still falling) but the big number tells the user music
  // hasn't started yet. Once the pre-roll window expires, the countdown
  // vanishes and only the falling notes remain.
  const inPreRoll = currentTime < PRE_ROLL_SECONDS
  const countdownLabel = (() => {
    if (!inPreRoll) return ''
    const remaining = Math.max(1, Math.ceil(PRE_ROLL_SECONDS - currentTime))
    if (currentTime < PRE_ROLL_SECONDS - 1) {
      return String(remaining)
    }
    return 'GO'
  })()

  return (
    <div
      ref={canvasRef}
      className={styles.canvas}
      aria-label="Falling notes lane"
      data-loop-active={loopEnabled}
      style={{ paddingBottom: `${HIT_LINE_HEIGHT_REM}rem` }}
    >
      <div className={styles.hitLine} />
      <div className={styles.hitLineGlow} />
      <div style={{ position: 'absolute', inset: 0 }}>
        {loopedNotes
          .filter((note) => {
            const safeMultiplier = tempoMultiplier > 0 ? tempoMultiplier : 1
            const wallStart = PRE_ROLL_SECONDS + note.startTime / safeMultiplier
            const delta = wallStart - currentTime
            return delta >= -LOOK_BEHIND_SECONDS && delta <= LOOK_AHEAD_SECONDS
          })
          .map((note) => (
            <RenderedNote
              key={`${note.startTime}-${note.pitch}`}
              note={note}
              currentTime={currentTime}
              isPressed={activeNotesSet.has(note.pitch)}
              layoutEngine={layoutEngine}
              pixelsPerSecond={pixelsPerSecond}
            />
          ))}
      </div>
      {countdownLabel !== '' && (
        <div className={styles.countdown} key={countdownLabel} aria-live="polite">
          <span className={styles.countdownNumber}>{countdownLabel}</span>
        </div>
      )}
    </div>
  )
}

export const FallingNotes = memo(FallingNotesComponent)
