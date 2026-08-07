/**
 * Scarborough Fair — English traditional ballad, c. 1650. Public domain.
 *
 * 16 bars in 3/4 at 80 BPM, transposed to D minor. The classic
 * ascending melody that opens each verse.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const SCARBOROUGH_BPM = 80
const SCARBOROUGH_SECONDS_PER_BEAT = 60 / SCARBOROUGH_BPM

const SCARBOROUGH_MELODY: ReadonlyArray<SpecNote> = [
  // Are you going to Scarborough Fair?
  { pitch: 'A4', beats: 1 },
  { pitch: 'B4', beats: 0.5 },
  { pitch: 'A4', beats: 0.5 },
  { pitch: 'G4', beats: 1 },
  { pitch: 'A4', beats: 2 },
  { pitch: 'D5', beats: 2 },
  { pitch: 'C5', beats: 1 },
  // Parsley, sage, rosemary and thyme
  { pitch: 'B4', beats: 1 },
  { pitch: 'C5', beats: 0.5 },
  { pitch: 'B4', beats: 0.5 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'B4', beats: 2 },
  { pitch: 'E4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  { pitch: 'G4', beats: 1 },
]

export const SCARBOROUGH_FAIR: Song = {
  id: 'pd:scarborough-fair',
  name: 'Scarborough Fair',
  source: 'PD',
  tempoBPM: SCARBOROUGH_BPM,
  metadata: {
    composer: 'Traditional (c. 1650)',
    license: 'Public Domain',
  },
  notes: expandSpec(SCARBOROUGH_MELODY, SCARBOROUGH_SECONDS_PER_BEAT),
}
