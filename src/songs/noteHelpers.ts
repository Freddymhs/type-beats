/**
 * Note helpers — pure functions used to build song note arrays.
 *
 * These helpers exist so each PD song file reads as a sequence of
 * musical statements, not raw number tables. They live here (not in the
 * type module) because they're a serialization convenience — the type
 * `Note` is the contract; this module helps build `Note` arrays.
 */

import { midiPitch, type MidiPitch } from '../types/index.ts'

const PITCH_CLASS_SEMITONE = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
} as const

const pitchFromClassAndOctave = (
  noteClass: keyof typeof PITCH_CLASS_SEMITONE,
  octave: number,
): MidiPitch => midiPitch(12 * (octave + 1) + PITCH_CLASS_SEMITONE[noteClass])

/** MIDI pitch from "C4", "F#5", "Bb3" notation (b is shorthand for A#). */
export const p = (notation: string): MidiPitch => {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(notation)
  if (match === null) {
    throw new RangeError(`p(): invalid pitch notation "${notation}"`)
  }
  const [, letter, accidental, octaveText] = match
  const noteClass =
    `${letter.toUpperCase()}${accidental === 'b' ? '#' : (accidental ?? '')}` as keyof typeof PITCH_CLASS_SEMITONE
  const octave = Number(octaveText)
  if (noteClass in PITCH_CLASS_SEMITONE === false) {
    throw new RangeError(`p(): unknown pitch class "${noteClass}"`)
  }
  return pitchFromClassAndOctave(noteClass, octave)
}

export interface SpecNote {
  readonly pitch: string
  readonly beats: number
}

/**
 * Build a Note array from a list of `{ pitch, beats }` tokens, anchored
 * at a starting time. `beats` is expressed in quarter notes — pass tempo
 * via `secondsPerBeat` (typically 60 / BPM).
 */
export const expandSpec = (
  spec: ReadonlyArray<SpecNote>,
  secondsPerBeat: number,
  startAt = 0,
): ReadonlyArray<{
  readonly pitch: MidiPitch
  readonly startTime: number
  readonly duration: number
}> => {
  const out: { pitch: MidiPitch; startTime: number; duration: number }[] = []
  let cursor = startAt
  for (const token of spec) {
    const duration = token.beats * secondsPerBeat
    out.push({ pitch: p(token.pitch), startTime: cursor, duration })
    cursor += duration
  }
  return out
}

/** Concatenate multiple Note arrays (offset each subsequent chunk by the previous total). */
export const concatNotes = (
  chunks: ReadonlyArray<
    ReadonlyArray<{
      readonly pitch: MidiPitch
      readonly startTime: number
      readonly duration: number
    }>
  >,
): ReadonlyArray<{
  readonly pitch: MidiPitch
  readonly startTime: number
  readonly duration: number
}> => {
  const out: { pitch: MidiPitch; startTime: number; duration: number }[] = []
  let cursor = 0
  for (const chunk of chunks) {
    for (const note of chunk) {
      out.push({ pitch: note.pitch, startTime: cursor + note.startTime, duration: note.duration })
    }
    if (chunk.length > 0) {
      const last = chunk[chunk.length - 1]!
      cursor += last.startTime + last.duration
    }
  }
  return out
}
