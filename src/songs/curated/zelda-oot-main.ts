/**
 * The Legend of Zelda: Ocarina of Time — Main Theme (1998, Koji Kondo).
 *
 * Curated transcription of the iconic opening phrase, 8 bars at 84 BPM
 * in 4/4. The melody is whimsical (F major) and loops cleanly because
 * the last note (F5) leads back to the downbeat (A4).
 *
 * Attribution:
 *   game     = The Legend of Zelda: Ocarina of Time
 *   composer = Koji Kondo (1998)
 *   license  = ©Nintendo — used here under fair-use as a short,
 *              attributed study transcription. NOT public domain.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const ZELDA_BPM = 84
const ZELDA_SECONDS_PER_BEAT = 60 / ZELDA_BPM

const ZELDA_MELODY: ReadonlyArray<SpecNote> = [
  // Bar 1
  { pitch: 'A4', beats: 1 },
  { pitch: 'F4', beats: 0.5 },
  { pitch: 'A4', beats: 0.5 },
  { pitch: 'C5', beats: 1 },
  // Bar 2
  { pitch: 'B4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  // Bar 3
  { pitch: 'G4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'B4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  // Bar 4
  { pitch: 'G4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  { pitch: 'D4', beats: 1 },
  // Bar 5 — ascending sequence
  { pitch: 'E4', beats: 1 },
  { pitch: 'F4', beats: 1 },
  { pitch: 'G4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  // Bar 6
  { pitch: 'B4', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'D5', beats: 1 },
  { pitch: 'E5', beats: 1 },
  // Bar 7
  { pitch: 'D5', beats: 1 },
  { pitch: 'C5', beats: 1 },
  { pitch: 'B4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  // Bar 8 — cadence to F5
  { pitch: 'G4', beats: 1 },
  { pitch: 'A4', beats: 1 },
  { pitch: 'F5', beats: 2 },
]

export const ZELDA_OOT_MAIN: Song = {
  id: 'curated:zelda-oot-main',
  name: 'Zelda: OoT — Main Theme',
  source: 'curated',
  tempoBPM: ZELDA_BPM,
  metadata: {
    game: 'The Legend of Zelda: Ocarina of Time',
    composer: 'Koji Kondo (1998)',
    license: '©Nintendo — attributed study transcription',
  },
  notes: expandSpec(ZELDA_MELODY, ZELDA_SECONDS_PER_BEAT),
}
