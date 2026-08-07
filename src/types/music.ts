/**
 * Shared domain types for type-beats.
 *
 * Source of truth: docs/_CONCEPTO.md > Modelo de dominio.
 * Keep these types pure data — no Tone.js, no React, no Dexie imports.
 * Cross-layer boundaries MUST serialize through these shapes.
 */

export type MidiPitch = number & { readonly __brand: 'MidiPitch' }
export type Velocity = number & { readonly __brand: 'Velocity' }

export const MIDI_MIN = 0
export const MIDI_MAX = 127
export const VELOCITY_MIN = 0
export const VELOCITY_MAX = 127
export const DEFAULT_VELOCITY = 100

const clampInt = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    throw new RangeError(`expected finite number, got ${String(value)}`)
  }
  const integer = Math.trunc(value)
  if (integer < min || integer > max) {
    throw new RangeError(`value ${integer} out of range [${min}, ${max}]`)
  }
  return integer
}

export const midiPitch = (value: number): MidiPitch =>
  clampInt(value, MIDI_MIN, MIDI_MAX) as MidiPitch

export const velocity = (value: number): Velocity =>
  clampInt(value, VELOCITY_MIN, VELOCITY_MAX) as Velocity

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export type PitchClass = (typeof PITCH_CLASSES)[number]

export const pitchClassToSemitone = (pitchClass: PitchClass): number => {
  const index = PITCH_CLASSES.indexOf(pitchClass)
  if (index === -1) {
    throw new RangeError(`unknown pitch class: ${String(pitchClass)}`)
  }
  return index
}

/**
 * A single note event. Times are seconds from song start.
 * velocity is optional — defaults are applied at play time, not at storage time.
 */
export interface Note {
  readonly pitch: MidiPitch
  readonly startTime: number
  readonly duration: number
  readonly velocity?: Velocity
}

export type SongSource = 'PD' | 'curated' | 'imported'

export interface SongMetadata {
  readonly game?: string
  readonly composer?: string
  readonly license?: string
}

export interface Song {
  readonly id: string
  readonly name: string
  readonly source: SongSource
  readonly notes: ReadonlyArray<Note>
  readonly tempoBPM: number
  readonly metadata: SongMetadata
  readonly originalTimbre?: string
}

/**
 * Synth configuration for Tone.js. Nested objects are required because
 * Tone synths accept options like `{ oscillator: { type: 'square' } }`.
 * We constrain leaves to JSON-serializable scalars so we can round-trip
 * a Timbre through Dexie without losing fidelity.
 */
export type SynthConfigValue = number | string | boolean
export type SynthConfig = Readonly<Record<string, Readonly<Record<string, SynthConfigValue>>>>

export interface Envelope {
  readonly attack: number
  readonly decay: number
  readonly sustain: number
  readonly release: number
}

export interface Timbre {
  readonly id: string
  readonly name: string
  readonly synthConfig: SynthConfig
  readonly envelope: Envelope
}

export const DEFAULT_TIMBRES: ReadonlyArray<Timbre> = [
  {
    id: 'square',
    name: 'Square (NES chiptune)',
    synthConfig: { oscillator: { type: 'square' } },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 },
  },
  {
    id: 'triangle',
    name: 'Triangle',
    synthConfig: { oscillator: { type: 'triangle' } },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.2 },
  },
  {
    id: 'sineFlute',
    name: 'Sine flute',
    synthConfig: { oscillator: { type: 'sine' } },
    envelope: { attack: 0.08, decay: 0.2, sustain: 0.7, release: 0.4 },
  },
  {
    id: 'saw',
    name: 'Saw lead',
    synthConfig: { oscillator: { type: 'sawtooth' } },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.15 },
  },
  {
    id: 'ocarina',
    name: 'Ocarina',
    synthConfig: { oscillator: { type: 'triangle' } },
    envelope: { attack: 0.12, decay: 0.3, sustain: 0.6, release: 0.6 },
  },
] as const
