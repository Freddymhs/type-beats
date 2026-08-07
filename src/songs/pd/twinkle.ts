/**
 * Twinkle, Twinkle, Little Star — melody attributed to Mozart (1781).
 * French folk melody; lyrics by Jane Taylor (1806). Public domain.
 *
 * 16 bars in 4/4 at 120 BPM, the canonical C major arrangement.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const TWINKLE_BPM = 120
const TWINKLE_SECONDS_PER_BEAT = 60 / TWINKLE_BPM

const TWINKLE_MELODY: ReadonlyArray<SpecNote> = [
  // Twinkle, twinkle, little star
  { pitch: 'C4', beats: 1 },
  { pitch: 'C4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  // How I wonder what you are
  { pitch: 'A4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'G4', beats: 2 },
  // Up above the world so high
  { pitch: 'F4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  // Like a diamond in the sky
  { pitch: 'D4', beats: 1 },
  { pitch: 'D4', beats: 1 },
  { pitch: 'C4', beats: 2 },
]

export const TWINKLE: Song = {
  id: 'pd:twinkle',
  name: 'Twinkle, Twinkle, Little Star',
  source: 'PD',
  tempoBPM: TWINKLE_BPM,
  metadata: {
    composer: 'Mozart (1781) / Jane Taylor (1806)',
    license: 'Public Domain',
  },
  notes: expandSpec(TWINKLE_MELODY, TWINKLE_SECONDS_PER_BEAT),
}
