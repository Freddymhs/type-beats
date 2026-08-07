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

import { memo, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useTransportClock } from '../../audio/useTransportClock.ts'
import { pitchClassToSemitone } from '../../types/index.ts'
import type { Note } from '../../types/index.ts'
import type { RootState } from '../../store/index.ts'

import {
  FALLING_NOTES_LOOK_AHEAD_SECONDS as LOOK_AHEAD_SECONDS,
  FALLING_NOTES_LOOK_BEHIND_SECONDS as LOOK_BEHIND_SECONDS,
  FALLING_NOTES_PIXELS_PER_SECOND as PIXELS_PER_SECOND,
  FALLING_NOTES_HIT_LINE_HEIGHT_REM as HIT_LINE_HEIGHT_REM,
} from './FallingNotes.constants.ts'

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

const noteOffsetFraction = (midiPitch: number): number => {
  // Map 36..96 (C2..C7) onto 0..1 across the canvas width.
  const MIN = 36
  const MAX = 96
  const clamped = Math.max(MIN, Math.min(MAX, midiPitch))
  return (clamped - MIN) / (MAX - MIN)
}

const computeTransformY = (noteStart: number, currentTime: number): number => {
  const delta = noteStart - currentTime
  // Map deltaSeconds → px above the hit line:
  //   delta = +LOOK_AHEAD_SECONDS → top of canvas (-FALL_TRAVEL_HEIGHT)
  //   delta = 0                   → at hit line
  const yPx = -delta * PIXELS_PER_SECOND
  return yPx
}

interface RenderedNoteProps {
  readonly note: Note
  readonly currentTime: number
  readonly isPressed: boolean
}

const RenderedNote = memo(({ note, currentTime, isPressed }: RenderedNoteProps) => {
  const translateY = computeTransformY(note.startTime, currentTime)
  const leftPct = `${(noteOffsetFraction(note.pitch) * 100).toFixed(2)}%`
  const color = pitchColor(note.pitch)
  const className = `${styles.note} ${isPressed ? styles.notePressed : ''}`.trim()
  // The pitch semitone derived from pitchClassToSemitone is unused here; we
  // use midi-pitch modulo for color which is direct & deterministic.
  void pitchClassToSemitone

  return (
    <div
      className={className}
      style={{
        left: leftPct,
        transform: `translate3d(0, ${translateY}px, 0)`,
        background: color,
        width: '3%',
      }}
    />
  )
})
RenderedNote.displayName = 'RenderedNote'

interface FallingNotesProps {
  /** Optional override; defaults to the active song in Redux. */
  readonly notes?: ReadonlyArray<Note>
}

const FallingNotesComponent = ({ notes }: FallingNotesProps) => {
  const { currentTime } = useTransportClock()
  const activeSongId = useSelector((state: RootState) => state.songs.activeSongId)
  const songsById = useSelector((state: RootState) => state.songs.byId)
  const showFallingNotes = useSelector(
    (state: RootState) => state.settings.showFallingNotes ?? true,
  )
  const activeNotes = useSelector((state: RootState) => state.audio.activeNotes)
  const activeNotesSet = useMemo(() => new Set(activeNotes), [activeNotes])

  const sourceNotes = useMemo<ReadonlyArray<Note>>(() => {
    if (notes !== undefined) return notes
    if (activeSongId === null) return []
    const song = songsById[activeSongId]
    return song?.notes ?? []
  }, [notes, activeSongId, songsById])

  if (!showFallingNotes) {
    return <div className={`${styles.canvas} ${styles.hidden}`} aria-hidden="true" />
  }

  if (sourceNotes.length === 0) {
    return (
      <div className={styles.canvas} aria-label="Falling notes lane">
        <div className={styles.hitLine} />
        <div className={styles.hitLineGlow} />
        <div className={styles.empty}>No song loaded. Press Enter to start Tetris.</div>
      </div>
    )
  }

  // Without a current time we have no anchor — render the empty lane.
  if (currentTime === null) {
    return (
      <div className={styles.canvas} aria-label="Falling notes lane">
        <div className={styles.hitLine} />
        <div className={styles.hitLineGlow} />
        <div className={styles.empty}>Press Enter to start playback.</div>
      </div>
    )
  }

  return (
    <div
      className={styles.canvas}
      aria-label="Falling notes lane"
      style={{ paddingBottom: `${HIT_LINE_HEIGHT_REM}rem` }}
    >
      <div className={styles.hitLine} />
      <div className={styles.hitLineGlow} />
      <div style={{ position: 'absolute', inset: 0 }}>
        {sourceNotes
          .filter((note) => {
            const delta = note.startTime - currentTime
            return delta >= -LOOK_BEHIND_SECONDS && delta <= LOOK_AHEAD_SECONDS
          })
          .map((note) => (
            <RenderedNote
              key={`${note.startTime}-${note.pitch}`}
              note={note}
              currentTime={currentTime}
              isPressed={activeNotesSet.has(note.pitch)}
            />
          ))}
      </div>
    </div>
  )
}

export const FallingNotes = memo(FallingNotesComponent)
