/**
 * Metroid — Title Theme (1986, Hirokazu Tanaka).
 *
 * Curated transcription of the iconic opening phrase, 4 bars at 120 BPM
 * in 4/4. The melody is mysterious, low-register (C minor) and loops
 * cleanly because the last note (G4) leads back to the downbeat (C4).
 *
 * Attribution:
 *   game     = Metroid (NES, 1986)
 *   composer = Hirokazu Tanaka (1986)
 *   license  = ©Nintendo — used here under fair-use as a short,
 *              attributed study transcription. NOT public domain.
 */

import type { Song } from '../../types/index.ts'
import { expandSpec, type SpecNote } from '../noteHelpers.ts'

const METROID_BPM = 120
const METROID_SECONDS_PER_BEAT = 60 / METROID_BPM

const METROID_MELODY: ReadonlyArray<SpecNote> = [
  // Bar 1 — opening cell
  { pitch: 'C4', beats: 1.5 },
  { pitch: 'G4', beats: 0.5 },
  { pitch: 'C4', beats: 1 },
  { pitch: 'D4', beats: 1 },
  // Bar 2
  { pitch: 'E4', beats: 1.5 },
  { pitch: 'C4', beats: 0.5 },
  { pitch: 'D4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  // Bar 3
  { pitch: 'F4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  { pitch: 'D4', beats: 1 },
  { pitch: 'C4', beats: 1 },
  // Bar 4 — rest on G
  { pitch: 'D4', beats: 1 },
  { pitch: 'E4', beats: 1 },
  { pitch: 'G4', beats: 2 },
]

export const METROID_TITLE: Song = {
  id: 'curated:metroid-title',
  name: 'Metroid — Title',
  source: 'curated',
  tempoBPM: METROID_BPM,
  metadata: {
    game: 'Metroid (NES)',
    composer: 'Hirokazu Tanaka (1986)',
    license: '©Nintendo — attributed study transcription',
  },
  notes: expandSpec(METROID_MELODY, METROID_SECONDS_PER_BEAT),
}
