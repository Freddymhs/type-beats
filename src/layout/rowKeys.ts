/**
 * QWERTY row key constants — single source of truth for the 3 piano rows.
 *
 * Per CLAUDE.md §2: keyboard row mappings live in one file. The layout
 * uses them to build the key→pitch map; VisualPiano uses them to render
 * the on-screen rows; tests reference them to assert pitch ranges.
 *
 * BUG-046: each row is split into LEFT (4 keys, lower octave half)
 * + RIGHT (3 keys, upper octave half) with a visual gap. User plays
 * 4 columns with the left hand and 3 with the right. The middle key
 * of each row (Y, H, B) sits in the gap and is NOT mapped.
 *
 * Octave mapping:
 *   Top row    LEFT W,E,R,T → C5,D5,E5,F5   RIGHT U,I,O → G5,A5,B5
 *   Home row   LEFT S,D,F,G → C4,D4,E4,F4   RIGHT J,K,L → G4,A4,B4
 *   Bottom row LEFT Z,X,C,V → C3,D3,E3,F3   RIGHT N,M,, → G3,A3,B3
 */

export const TOP_ROW_KEYS = ['w', 'e', 'r', 't', 'u', 'i', 'o'] as const
export const HOME_ROW_KEYS = ['s', 'd', 'f', 'g', 'j', 'k', 'l'] as const
export const BOTTOM_ROW_KEYS = ['z', 'x', 'c', 'v', 'n', 'm', ','] as const

export const TOP_ROW_LEFT = TOP_ROW_KEYS.slice(0, 4)
export const TOP_ROW_RIGHT = TOP_ROW_KEYS.slice(4)
export const HOME_ROW_LEFT = HOME_ROW_KEYS.slice(0, 4)
export const HOME_ROW_RIGHT = HOME_ROW_KEYS.slice(4)
export const BOTTOM_ROW_LEFT = BOTTOM_ROW_KEYS.slice(0, 4)
export const BOTTOM_ROW_RIGHT = BOTTOM_ROW_KEYS.slice(4)

/** Visual gap between left (4 keys) and right (3 keys) — fraction of total width. */
export const ROW_GAP_FRACTION = 0.05
