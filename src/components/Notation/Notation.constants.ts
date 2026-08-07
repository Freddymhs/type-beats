/**
 * Internal tuning constants for `<Notation />`.
 *
 * Lives in a sibling `.ts` file so `Notation.tsx` only exports React
 * components — keeps `react-refresh/only-export-components` clean for HMR.
 */

export const NOTATION_WIDTH = 720
export const NOTATION_HEIGHT = 160
export const NOTATION_PADDING = 8
export const NOTATION_STAVE_X = NOTATION_PADDING
export const NOTATION_STAVE_Y = NOTATION_PADDING * 2
export const NOTATION_STAVE_WIDTH = NOTATION_WIDTH - NOTATION_PADDING * 2

export const NOTATION_HIGHLIGHT_FILL = '#ffd83d'
export const NOTATION_DEFAULT_FILL = '#e8eaed'
