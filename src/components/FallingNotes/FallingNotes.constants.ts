/**
 * Internal tuning constants for `<FallingNotes />`.
 *
 * Exposed for tests and future tuning. Lives in a sibling `.ts` file so the
 * `FallingNotes.tsx` component module only exports React components (keeps
 * `react-refresh/only-export-components` clean for HMR).
 */

// Per BUG-035: pre-roll before audio starts so the user has time to see
// notes falling and prepare their hands. The same offset is applied in
// `SongTransport.scheduleNotes` so audio fires when the visual reaches the
// hit line, not before.
// Per BUG-041/042: bumped to 5s minimum so the user has at least 5
// seconds of countdown + visible falling notes to prepare.
export const FALLING_NOTES_PRE_ROLL_SECONDS = 5

export const FALLING_NOTES_LOOK_AHEAD_SECONDS = 4
export const FALLING_NOTES_LOOK_BEHIND_SECONDS = 0.25
// Fallback used before the first ResizeObserver measurement lands.
// Once canvas height is known, PIXELS_PER_SECOND is computed dynamically
// as `(canvasHeight - hitLineOffset) / LOOK_AHEAD_SECONDS` so notes
// always fill the available vertical space.
export const FALLING_NOTES_PIXELS_PER_SECOND = 140
export const FALLING_NOTES_FALL_TRAVEL_HEIGHT =
  FALLING_NOTES_LOOK_AHEAD_SECONDS * FALLING_NOTES_PIXELS_PER_SECOND
export const FALLING_NOTES_HIT_LINE_HEIGHT_REM = 1.5
export const FALLING_NOTES_HIT_LINE_OFFSET_PX = FALLING_NOTES_HIT_LINE_HEIGHT_REM * 16
