/**
 * Notation helpers — pure conversion from `Note[]` to VexFlow data structures.
 *
 * These functions isolate the dependency on `vexflow` so unit tests can
 * run in jsdom without instantiating the full SVG renderer. The component
 * itself is the only place that touches `Renderer` / `Stave` directly.
 *
 * Per CLAUDE.md §0: keep this module side-effect-free; React component
 * stays in `Notation.tsx`.
 */

import { Accidental, StaveNote, type NoteStruct } from 'vexflow'

import type { Note } from '../../types/index.ts'

const MIDI_TO_VEXFLOW_KEYS: ReadonlyArray<string> = [
  'c',
  'c#',
  'd',
  'd#',
  'e',
  'f',
  'f#',
  'g',
  'g#',
  'a',
  'a#',
  'b',
] as const

const NOTE_NAME_REGEX = /^([a-g])([b#]?)(-?\d+)$/

const pitchNameParts = (
  midiPitch: number,
): { letter: string; accidental: string; octave: number } => {
  const octave = Math.floor(midiPitch / 12) - 1
  const pitchClass = ((midiPitch % 12) + 12) % 12
  const noteName = MIDI_TO_VEXFLOW_KEYS[pitchClass] ?? 'c'
  const match = NOTE_NAME_REGEX.exec(noteName)
  const letter = match?.[1] ?? 'c'
  const accidental = match?.[2] ?? ''
  return { letter, accidental, octave }
}

const pitchToVexKey = (midiPitch: number): string => {
  const { letter, accidental, octave } = pitchNameParts(midiPitch)
  return `${letter}${accidental}/${octave}`
}

const hasAccidental = (midiPitch: number): boolean => {
  const { accidental } = pitchNameParts(midiPitch)
  return accidental === '#'
}

/**
 * Group simultaneous notes into a single VexFlow chord (StaveNote).
 * Notes are sorted by ascending pitch (low → high) as VexFlow expects.
 */
export const groupSimultaneousNotes = (
  notes: ReadonlyArray<Note>,
): ReadonlyArray<ReadonlyArray<Note>> => {
  if (notes.length === 0) return []
  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime || a.pitch - b.pitch)
  const groups: Note[][] = []
  for (const note of sorted) {
    const last = groups[groups.length - 1]
    if (last === undefined || Math.abs(last[0]!.startTime - note.startTime) > 1e-3) {
      groups.push([note])
    } else {
      last.push(note)
    }
  }
  return groups
}

export interface NotationChord {
  readonly keys: string[]
  readonly duration: string
  readonly startTime: number
  readonly pitches: ReadonlyArray<number>
}

/**
 * Choose a VexFlow duration string that best represents the actual
 * duration of the chord (in beats). Each note's duration is averaged
 * for chords.
 */
const durationToVexDuration = (seconds: number, tempoBPM: number): string => {
  const beats = seconds * (tempoBPM / 60)
  if (beats >= 4) return 'w'
  if (beats >= 2) return 'h'
  if (beats >= 1) return 'q'
  if (beats >= 0.5) return '8'
  if (beats >= 0.25) return '16'
  return '32'
}

/**
 * Convert simultaneous-note groups to NotationChord descriptors that the
 * component can render. Intermediate data so the renderer stays free of
 * state mutations.
 */
export const toNotationChords = (
  notes: ReadonlyArray<Note>,
  tempoBPM: number,
): ReadonlyArray<NotationChord> => {
  const groups = groupSimultaneousNotes(notes)
  return groups.map((group) => {
    const firstNote = group[0]!
    const avgDuration = group.reduce((sum, n) => sum + n.duration, 0) / group.length
    const keys = group.map((n) => pitchToVexKey(n.pitch))
    return {
      keys,
      duration: durationToVexDuration(avgDuration, tempoBPM),
      startTime: firstNote.startTime,
      pitches: group.map((n) => n.pitch),
    }
  })
}

/**
 * Build VexFlow StaveNote objects from a list of NotationChords.
 * Pure function so the renderer can rebuild on tempo/song change
 * without React state churn.
 */
export const buildStaveNotes = (chords: ReadonlyArray<NotationChord>): StaveNote[] => {
  const staveNotes: StaveNote[] = []
  for (const chord of chords) {
    const noteStruct: NoteStruct = {
      keys: [...chord.keys],
      duration: chord.duration,
    }
    const staveNote = new StaveNote(noteStruct)
    for (const pitch of chord.pitches) {
      if (hasAccidental(pitch)) {
        staveNote.addModifier(new Accidental('#'), 0)
      }
    }
    staveNotes.push(staveNote)
  }
  return staveNotes
}

/**
 * Returns true when the given VexFlow key string contains a sharp.
 * Exposed for the highlight step in the component.
 */
export const keyHasSharp = (vexKey: string): boolean => vexKey.includes('#')
