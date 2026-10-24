/**
 * Synthesia Classic — 3-octave QWERTY layout (per BUG-036).
 *
 * User upgraded from 2 rows to 3 rows. Top row is the QWERTY letter row
 * (Q W E R T Y U) mapping octave 5. ASDFGHJ stays in the middle (octave 4).
 * ZXCVBNM stays on the bottom (octave 3).
 *
 *   Top row (octave 5): Q W E R T Y U
 *   Home row (octave 4): A S D F G H J
 *   Bottom row (octave 3): Z X C V B N M
 *
 * Black keys were removed because W/E/T/Y/U were the previous octave 4
 * black-key positions — they now serve as octave 5 whites, leaving no
 * room for an octave 4 black overlay without colliding.
 *
 * Modifiers:
 *   - 1..5 → timbre select
 *   - 9 / 0 → timbre cycle prev/next
 *   - \ → falling-notes toggle
 *   - ' → notation toggle
 *   - Space → sustain
 *   - Shift + Z / X → octave down/up
 *
 * Groups: per-key tags ('white' / 'modifier') used by CSS Modules.
 */

import type { Layout, LayoutGroups } from '../types/index.ts'
import { TOP_ROW_KEYS, HOME_ROW_KEYS, BOTTOM_ROW_KEYS } from './rowKeys.ts'

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

const topRow = TOP_ROW_KEYS
const homeRow = HOME_ROW_KEYS
const bottomRow = BOTTOM_ROW_KEYS

const mappings: Record<string, { note: string; octave: number }> = {}

for (const [index, key] of topRow.entries()) {
  mappings[key] = { note: WHITE_KEYS[index], octave: 5 }
}

for (const [index, key] of homeRow.entries()) {
  mappings[key] = { note: WHITE_KEYS[index], octave: 4 }
}

for (const [index, key] of bottomRow.entries()) {
  mappings[key] = { note: WHITE_KEYS[index], octave: 3 }
}

const groupsRecord: Record<string, string> = {}
for (const key of topRow) groupsRecord[key] = 'white'
for (const key of homeRow) groupsRecord[key] = 'white'
for (const key of bottomRow) groupsRecord[key] = 'white'

const modifierKeys = ['1', '2', '3', '4', '5', '9', '0', ' ', '\\', "'"] as const
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
  '\\': 'toggle-falling-notes',
  "'": 'toggle-notation',
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
