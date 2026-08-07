/**
 * Internal pitch-class table — kept separate so it can be re-exported
 * from the barrel without re-exporting the brand type constructors
 * (which would pull validators into consumers that just want labels).
 */

export const PITCH_CLASSES = [
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
] as const
