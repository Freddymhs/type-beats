/**
 * Internal tuning constants for `<FallingNotes />`.
 *
 * Exposed for tests and future tuning. Lives in a sibling `.ts` file so the
 * `FallingNotes.tsx` component module only exports React components (keeps
 * `react-refresh/only-export-components` clean for HMR).
 */

export const FALLING_NOTES_LOOK_AHEAD_SECONDS = 4
export const FALLING_NOTES_LOOK_BEHIND_SECONDS = 0.25
export const FALLING_NOTES_PIXELS_PER_SECOND = 100
export const FALLING_NOTES_FALL_TRAVEL_HEIGHT =
  FALLING_NOTES_LOOK_AHEAD_SECONDS * FALLING_NOTES_PIXELS_PER_SECOND
export const FALLING_NOTES_HIT_LINE_HEIGHT_REM = 1.5
