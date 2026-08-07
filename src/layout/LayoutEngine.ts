/**
 * LayoutEngine — compiles a Layout into O(1) lookup tables.
 *
 * Inputs: declarative Layout (persisted in Dexie, JSON-serializable).
 * Outputs: CompiledLayout with Map<key, MidiPitch> and Map<MidiPitch, key>
 *          plus the original modifiers/groups pass-through.
 *
 * Usage:
 *   const engine = new LayoutEngine(SYNTHESIA_CLASSIC_LAYOUT)
 *   const pitch = engine.getNote('a') // 60 (C4)
 *   const key = engine.getKey(60)     // 'a'
 *   if (engine.isModifier('f')) {
 *     const action = engine.getModifier('f')
 *   }
 *
 * Octave policy: pitch = 12 * (octave + 1) + semitoneIndex(note).
 *   - C4 = 60 (MIDI standard middle C)
 *   - A4 = 69 (440 Hz reference)
 */

import { midiPitch, pitchClassToSemitone, type MidiPitch, type PitchClass } from '../types/index.ts'
import type { CompiledLayout, Layout } from '../types/index.ts'

const noteToSemitone = (note: string): number => {
  if (!isPitchClass(note)) {
    throw new RangeError(`LayoutEngine: invalid pitch class "${note}" — expected C, C#, D, … B`)
  }
  return pitchClassToSemitone(note)
}

const isPitchClass = (value: string): value is PitchClass => {
  const valid: ReadonlyArray<string> = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ]
  return valid.includes(value)
}

export const compileLayout = (layout: Layout): CompiledLayout => {
  const keyToNote = new Map<string, MidiPitch>()
  const noteToKey = new Map<number, string>()

  for (const [key, mapping] of Object.entries(layout.mappings)) {
    const semitone = noteToSemitone(mapping.note)
    const pitchValue = 12 * (mapping.octave + 1) + semitone
    const pitch = midiPitch(pitchValue)
    keyToNote.set(key, pitch)
    noteToKey.set(pitch, key)
  }

  return {
    id: layout.id,
    name: layout.name,
    keyToNote,
    noteToKey,
    modifiers: layout.modifiers,
    groups: layout.groups,
  }
}

export class LayoutEngine {
  private readonly compiled: CompiledLayout

  constructor(layout: Layout) {
    this.compiled = compileLayout(layout)
  }

  getNote(key: string): MidiPitch | undefined {
    return this.compiled.keyToNote.get(key)
  }

  getKey(pitch: MidiPitch): string | undefined {
    return this.compiled.noteToKey.get(pitch)
  }

  isModifier(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.compiled.modifiers, key)
  }

  getModifier(key: string): string | undefined {
    return this.compiled.modifiers[key]
  }

  getGroup(key: string): string | undefined {
    return this.compiled.groups[key]
  }

  getId(): string {
    return this.compiled.id
  }

  getName(): string {
    return this.compiled.name
  }

  getCompiled(): CompiledLayout {
    return this.compiled
  }
}
