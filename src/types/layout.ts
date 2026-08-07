/**
 * Keyboard layout types.
 *
 * A Layout is the compile input — JSON-serializable, persistable to Dexie.
 * The compiled lookup tables live in src/layout/LayoutEngine.ts.
 */

import type { MidiPitch } from './music.ts'

/**
 * A single QWERTY key assignment. note is the pitch class (C, C#, D…),
 * octave is the MIDI octave (3, 4, 5…). Combined at lookup time into a MIDI pitch.
 */
export interface KeyMapping {
  readonly note: string
  readonly octave: number
}

/**
 * Modifier bindings — chord-prefix keys (Shift, Alt, Control…) bound to actions
 * like 'timbre-1' or 'tempo-up'. The action string is opaque to this layer —
 * the consumer maps it to a real reducer dispatch.
 */
export type ModifierAction = string
export type ModifierMap = Readonly<Record<string, ModifierAction>>

/**
 * Visual coloring groups — keys tagged with a group name ('white', 'black',
 * 'modifier') get rendered with a class from CSS Modules. Pure data.
 */
export type LayoutGroupName = string
export type LayoutGroups = Readonly<Record<string, LayoutGroupName>>

export interface Layout {
  readonly id: string
  readonly name: string
  readonly mappings: Readonly<Record<string, KeyMapping>>
  readonly modifiers: ModifierMap
  readonly groups: LayoutGroups
}

export interface CompiledMapping {
  readonly key: string
  readonly pitch: MidiPitch
}

export interface CompiledLayout {
  readonly id: string
  readonly name: string
  readonly keyToNote: ReadonlyMap<string, MidiPitch>
  readonly noteToKey: ReadonlyMap<number, string>
  readonly modifiers: ModifierMap
  readonly groups: LayoutGroups
}
