/**
 * Synthesia Classic — default 3-octave QWERTY layout.
 *
 * Mapping (canonical Synthesia convention + concept's 3-octave scope):
 *
 *   Black keys (top row):
 *     W E   T Y U
 *      C# D#  F# G# A#   (octave 4)
 *
 *   White keys (home row, octave 4):
 *     A S D F G H J
 *     C D E F G A B
 *
 *   White keys (bottom row, octave 3 + 4):
 *     Z X C V B N M
 *     C D E F G A B
 *
 * Modifiers (top row / edge keys):
 *   - 1..5 → timbre select (synthesia classic: numeric shortcuts)
 *   - 9 / 0 → timbre cycle prev/next
 *   - F → falling-notes toggle
 *   - Space → sustain
 *   - Shift + Z / X → octave down/up
 *
 * Groups: per-key tags ('white' / 'black' / 'modifier') used by CSS Modules.
 */

import type { Layout, LayoutGroups } from '../types/index.ts'

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

const homeRow = ['a', 's', 'd', 'f', 'g', 'h', 'j'] as const
const bottomRow = ['z', 'x', 'c', 'v', 'b', 'n', 'm'] as const
const blackRow = ['w', 'e', 't', 'y', 'u'] as const
const blackNotes = ['C#', 'D#', 'F#', 'G#', 'A#'] as const

const mappings: Record<string, { note: string; octave: number }> = {}

for (const [index, key] of homeRow.entries()) {
  mappings[key] = { note: WHITE_KEYS[index], octave: 4 }
}

for (const [index, key] of bottomRow.entries()) {
  mappings[key] = { note: WHITE_KEYS[index], octave: index < 3 ? 3 : 4 }
}

for (const [index, key] of blackRow.entries()) {
  mappings[key] = { note: blackNotes[index], octave: 4 }
}

const groupsRecord: Record<string, string> = {}
for (const key of homeRow) groupsRecord[key] = 'white'
for (const key of bottomRow) groupsRecord[key] = 'white'
for (const key of blackRow) groupsRecord[key] = 'black'

const modifierKeys = ['1', '2', '3', '4', '5', '9', '0', 'f', ' '] as const
for (const key of modifierKeys) groupsRecord[key] = 'modifier'

const groups: LayoutGroups = groupsRecord

const modifiers: Record<string, string> = {
  '1': 'timbre-1',
  '2': 'timbre-2',
  '3': 'timbre-3',
  '4': 'timbre-4',
  '5': 'timbre-5',
  '9': 'timbre-cycle-prev',
  '0': 'timbre-cycle-next',
  f: 'toggle-falling-notes',
  ' ': 'sustain',
  'Shift+z': 'octave-down',
  'Shift+x': 'octave-up',
}

export const SYNTHESIA_CLASSIC_LAYOUT: Layout = {
  id: 'synthesia-classic',
  name: 'Synthesia Classic (3 octaves)',
  mappings,
  modifiers,
  groups,
}
